# RUNBOOK - LINE友だち登録システム運用手順書

## 1. 緊急停止（Kill-Switch）

### 即座に停止する方法

```bash
# Supabase Edge Functionの環境変数を設定
supabase secrets set FEATURE_BOT_ENABLED=false --project-ref <your-project-ref>

# または、LINE Developers ConsoleでWebhookをOFF
```

### 確認

```bash
# Front Doorにリクエストを送信
curl https://<your-domain>/functions/v1/relay

# 503 "Bot is disabled" が返ればOK
```

---

## 2. 復旧手順

### 2-1. Front Door疎通確認

```bash
# 署名なしでテスト（開発環境のみ）
curl -X POST https://<your-domain>/functions/v1/relay \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 200 OKが返ればFront Doorは正常
```

### 2-2. GitHub Actions疎通確認

```bash
# 手動でワークフローをトリガー
gh workflow run manus-progress.yml

# 実行状況を確認
gh run list --workflow=manus-progress.yml
```

### 2-3. GPT疎通確認

```bash
# GitHub Secretsを確認
gh secret list

# LLM_ENDPOINT, LLM_API_KEYが設定されているか確認
```

### 2-4. Manus疎通確認

```bash
# Manus APIにリクエスト
curl -X POST https://api.manus.im/v1/tasks \
  -H "Authorization: Bearer $MANUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'
```

### 2-5. 本番復旧

```bash
# FEATURE_BOT_ENABLEDをtrueに戻す
supabase secrets set FEATURE_BOT_ENABLED=true --project-ref <your-project-ref>

# LINE Developers ConsoleでWebhookをON
```

---

## 3. ロールバック手順

### 3-1. 未マージPRのクローズ

```bash
# PRをクローズ
gh pr close <PR番号>

# ブランチを削除
git push origin --delete <ブランチ名>
```

### 3-2. Secrets回収

```bash
# 未使用のSecretsを削除
gh secret delete <SECRET_NAME>

# 監査ログに記録
echo "$(date): Deleted secret <SECRET_NAME>" >> logs/audit.log
git add logs/audit.log
git commit -m "audit: delete unused secret"
git push
```

### 3-3. Front DoorのURL切替

```bash
# DNSを旧URLに戻す
# または、LINE Developers ConsoleでWebhook URLを変更
```

### 3-4. Manusタスクのキャンセル

```bash
# 保留中のタスクを確認
# TODO: Manus APIでタスク一覧を取得

# タスクをキャンセル
# TODO: Manus APIでタスクをキャンセル
```

---

## 4. 監視

### 4-1. 外形監視

- **Front Doorの200率**: UptimeRobotで5分間隔
- **目標**: 99.9% uptime

### 4-2. SLO監視

| 指標 | 目標値 | 確認方法 |
|-----|-------|---------|
| delivery latency (p50) | < 2s | logs/progress/*.json |
| delivery latency (p95) | < 10s | logs/progress/*.json |
| error_rate (5分移動窓) | < 1% | logs/progress/*.json |
| heartbeat_miss | < 2/10min | GitHub Actions logs |

### 4-3. コスト監視

```bash
# 1日のManus使用量を確認
python orchestration/cost.py orchestration/plan/current_plan.json

# 予算超過の場合はデグレード
```

---

## 5. メッセージ配信ポリシー

- **頻度制限**: 同一ユーザー宛の自動配信は 1 日 1 通、週次最大 3 通まで。`line-event.yml` の `dedupe_key`／`retry_after_seconds` および PlanDelta 判定で超過を防止する。
- **例外運用**: イベント告知など緊急性の高い配信は Ops Lead の承認を経て実施し、`logs/progress/` にメモを残す。
- **セグメント**: 初期リリースは全ユーザー一律。`cta_tags` を基にした手動セグメントから検証し、エンゲージメント指標による自動セグメントは後続フェーズで段階導入。
- **レビュー**: Product/Ops が月次で KPI レポートを確認し、必要に応じて上限値やセグメント方針を更新する。更新内容は `.sdd/specs/line-funnel/decisions.md` と本 Runbook に反映する。

---

## 6. Google Sheets 台帳管理

- **用途**: Supabase 完全移行までの暫定 CRM。`scripts/sheets/upsert-line-member.js` が `line-event.yml` から呼ばれ、`user_hash` をキーに upsert。
- **保持期間**: 移行完了までアクティブデータは保持。Supabase へ移行後は 6 か月でアーカイブ削除。過去データは Supabase 側で永続化する。
- **アクセス権限**: 編集は Tech Lead / Ops Lead のみ。閲覧は Marketing チームと Product Lead に限定。Google Workspace Admin で監査ログを有効化。
- **監査と照合**: 月次で `scripts/reconcile-ledgers.ts`（実装予定）または手動クロスチェックを実施し、重大な差分は Slack `#line-ops` に報告。結果は `logs/progress/` もしくは KPI レポートに添付する。

---

## 7. ログローテーション

- **自動化**: `scripts/rotate-logs.sh` が 90 日超過の `logs/progress/*.json` を gzip 圧縮して `logs/progress/archive/YYYY-MM/` に移動し、1 年超過分を削除。
- **スケジュール**: `.github/workflows/rotate-logs.yml` が毎週月曜 03:00 JST に実行。手動実行は GitHub の `workflow_dispatch` またはローカルで `bash scripts/rotate-logs.sh`。
- **リポジトリ監視**: スクリプト内で `git count-objects -vH` を利用し、100MB 超で警告、200MB 超で強制アーカイブを実施。Actions 実行時のみ自動コミットを行う。
- **運用メモ**: アーカイブされた gzip は Git LFS を使わずそのまま保持。四半期ごとに保持期間の妥当性を見直し、必要なら閾値を更新。

---

## 8. 予算管理

### 8-1. 予算設定

- **BUDGET_DAY**: 50pt/day
- **BUDGET_WEEK**: 200pt/week

### 8-2. 自動デグレードと縮退運用

- `economic-circuit-breaker.yml` が `BUDGET.yml` の閾値を監視し、閾値超過時に `MANUS_ENABLED=false` と `orchestration/plan/production/degraded.flag` を設定して縮退モードへ移行。
- 縮退中は Manus API 呼び出しを停止し、`line-event.yml` が `docs/alerts/line_degraded_outreach.ics` を通知に添付。Supabase と Google Sheets への書き込みは継続する。
- Ops Lead は通知後 24 時間以内に対象リードを手動フォローし、結果を `logs/progress/` に追記。Slack `#line-ops` で担当割り当てとフォロー完了を共有する。
- 手動対応時も医療ガードレール（個別診断を避け、緊急時は医療機関受診を案内）を必ず付与する。

### 8-3. 復旧手順

1. 予算消化が閾値内に戻ったことを Finance/Ops が確認。
2. `economic-circuit-breaker.yml` を手動実行し、`MANUS_ENABLED=true` に戻す。
3. `degraded.flag` を削除して通常プランへ復帰後、`line-event.yml` の GitHub Step Summary でモードが `normal` に戻ったことを確認。
4. ICS テンプレートやフォロー記録を見直し、`weekly-kpi-report.yml` で縮退期間中の件数を報告。

---

## 9. 連絡網

### 9-1. 管理者連絡先

- **LINE**: @529ybhfo
- **Gmail**: mo666.med@gmail.com

### 9-2. エスカレーション

| レベル | 対応者 | 連絡方法 |
|-------|-------|---------|
| L1: 軽微な障害 | 開発者 | GitHub Issues |
| L2: 中程度の障害 | 技術責任者 | LINE + Gmail |
| L3: 重大な障害 | 経営層 | 電話 |

### 9-3. 法務・税務窓口

- **法務顧問**: 月3万円／5万円枠
- **税務顧問**: 固定費設計に依拠

---

## 10. よくあるトラブルと対処法

### 10-1. Front Doorが503を返す

**原因**: FEATURE_BOT_ENABLED=false

**対処**: 
```bash
supabase secrets set FEATURE_BOT_ENABLED=true --project-ref <your-project-ref>
```

### 10-2. GitHub Actionsが動かない

**原因**: Secretsが未設定

**対処**:
```bash
gh secret list
# 不足しているSecretsを追加
gh secret set <SECRET_NAME> --body "<value>"
```

### 10-3. GPT解析が失敗する

**原因**: LLM_API_KEYが無効

**対処**:
```bash
# 新しいAPIキーを発行
gh secret set LLM_API_KEY --body "sk-..."
```

### 10-4. Manusポイントが足りない

**原因**: 予算超過

**対処**:
- `gh workflow run economic-circuit-breaker.yml` を実行し、`MANUS_ENABLED=false` と `orchestration/plan/production/degraded.flag` が生成されたことを確認する。
- `docs/alerts/line_degraded_outreach.ics` のテンプレートで通知を送り、Ops Lead が 24 時間以内に手動フォローを開始する。
- フォロー完了後、`logs/progress/` に結果を記録し、`weekly-kpi-report.yml` のレポートで縮退件数を共有する。

---

## 11. 定期メンテナンス

### 11-1. 週次

- [ ] `logs/progress/` の最新ログと `logs/progress/archive/` を確認
- [ ] SLO達成状況と GitHub Step Summary をレビュー
- [ ] Manusポイント消費量を確認 (`economic-circuit-breaker.yml` の履歴含む)
- [ ] `.github/workflows/rotate-logs.yml` の実行結果と自動コミットをチェック
- [ ] Slack `#line-ops` で手動フォロー案件の進捗を共有

### 11-2. 月次

- [ ] Secretsのローテーション
- [ ] Supabase Edge (Front Door) の証明書更新確認
- [ ] Supabase と Google Sheets の差分を照合（`scripts/reconcile-ledgers.ts` 実装後はレポート添付）
- [ ] `.sdd/specs/line-funnel/decisions.md` / Runbook の内容を最新化

---

## 12. 参考リンク

- [GitHub Repository](https://github.com/mo666-med/line-friend-registration-system)
- [LINE Developers Console](https://developers.line.biz/console/)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Manus API Documentation](https://docs.manus.im)
