# Design – Cursorvers LINE Funnel

## Requirements Review & Status
- 仕様要件（`.sdd/specs/line-funnel/requirements.md`）の疑問点は、KPI 定義・Sheets vs Supabase 役割・Plan JSON 承認フローなど一部残るが、設計段階では以下の仮定で進める：
  - KPI 集計は GitHub Actions 週次レポートで実施し、責任者はマーケチーム。正確な指標は後続の requirements フォローアップで確定予定。
  - 当面は Google Sheets を主要な登録者台帳として使用し、Supabase は進捗ログ等の補助。両者のアクセス権管理は GitHub Secrets + Service Account で統一。
  - Plan JSON 変更は GitHub PR + CODEOWNERS 宛にレビュー必須とし、`plan-validator` ワークフローで差分検証を自動化予定。
- 追加の情報が必要な場合は requirements フェーズへ差し戻す前提で設計を進める。

---

## Architecture Overview

### System Boundaries & Data Flow
```
[note記事CTA] → [LINE友だち追加] ──┐
                                     ├─ (LINE webhook, X-Line-Signature)
[Manus Progress webhook] ────────────┘
                                     ▼
                         Front Door (Supabase Edge / Workers, TypeScript)
                             - 署名検証 (LINE HMAC / Manus Bearer)
                             - payloadサニタイズ & userIdハッシュ化 (HASH_SALT)
                             - GitHub repository_dispatch 発火
                                     ▼
                         GitHub Actions Workflows
                             ├ line-event.yml
                             │   - Plan JSONロード/PlanDelta生成
                             │   - Costチェック → Degrade制御
                             │   - Google Sheets登録、LINE返信
                             ├ manus-progress.yml
                             │   - ProgressEvent記録、PlanDelta評価、Manus再実行
                             ├ economic-circuit-breaker.yml, KPIレポート etc.
                                     ▼
                         外部サービス
                             - LINE Messaging API（返信）
                             - Google Sheets（登録者台帳）
                             - Supabase（進捗・観測ログ）
                             - Manus API（開発時/最末 mile のみ）
```

### Component Responsibilities
- **Front Door** (`functions/relay/index.ts`):
  - Deno/Edge ランタイムで稼働。LINE HMAC署名と Manus Bearer を timing-safe に検証。
  - `HASH_SALT` を用いてユーザーIDを SHA-256 → hex16桁に短縮。
  - `repository_dispatch` リクエストを GitHub REST API に送信。失敗時は 502 を返しログ出力。
  - 今後: KV/Storage を利用した idempotency（イベント重複制御）を追加検討。

- **GitHub Actions Workflows**:
  - `line-event.yml`: 
    - payload を解析し、イベントタイプ（`follow`, `message`, `unfollow` 等）ごとにハンドラを分岐。
    - `DEVELOPMENT_MODE` の場合は GPT/Manus による PlanDelta 生成。`production` では `orchestration/plan/production/current_plan.json` をコピーして実行。
    - `orchestration/cost.py` を呼び出し、Manus使用コストと `BUDGET.yml` による閾値確認。
    - Google Sheets へメタデータ書き込み（Apps Script API or Manus CLI）／Supabase へログ送信。
    - LINE Messaging API でガードレール付メッセージ送信。
  - `manus-progress.yml`:
    - Manus 進捗イベントをログ化 (`logs/progress/` へ JSON, Git commit)。
    - PlanDelta を解析し、`decision: retry/amended` の場合のみ Manus API を再実行または次ステップを起動。
    - 解析結果を GitHub へ通知（Issueコメント or Workflow summary）。
  - `economic-circuit-breaker.yml`:
    - `BUDGET.yml` を読込み、指定閾値到達で Manus 連携停止 → LINE + ICS 代替ルートに切替。
  - 週次/KPI レポート:
    - Google Sheets/Supabase から KPI を集計し、40% 目標に対する到達状況を報告。
  - `manus-task-runner.yml`:
    - `MANUS_ENABLED` が `true` の場合のみ週次スケジュール／`repository_dispatch` で Manus API に Plan/Brief を送信し、PC なしで調整可能。

- **Orchestration (`orchestration/`)**:
  - `cost.py`: Plan JSON を解析し予測コストを算出、Manus 連携前に budget check を提供。
  - `plan/current_plan.json`: 本番用 Plan JSON。開発モードとの差分は PlanDelta で管理。
  - Manus briefs (`MANUS_EXECUTION_BRIEF_*`): Manus 作業をコスト抑制しつつ委託する際の手順。

- **Data Stores**:
  - Google Sheets：`line_members` 台帳（`line_user_hash`, `display_name`, `segment`, `registered_at`, `last_active_at`, `conversion_status` など）。
  - Supabase：`progress_events`、`budget_snapshots`、`alerts` 等を保存。（初期は省略可、GitHub logs で代替）
  - Git リポジトリ：`logs/progress/*.json`, Plan/PlanDelta, KPI レポートを履歴管理。

### Patterns & Libraries
- TypeScript + std crypto（Deno互換）を使用し、余計な依存を抑制。
- GitHub Actions は `actions/checkout`, `actions/setup-node`, `google-github-actions`, `supabase/cli-action`, `peter-evans/commit-comment` などを活用。
- Google Sheets 連携は Service Account＋`googleapis` CLI、もしくは Manus CLI の `sheets.update` コネクタ。
- LINE Messaging は `@line/bot-sdk` 相当の CLI/自作 Node スクリプト（GitHub Actions 内）で対応。
- 仕様駆動：Plan JSON は JSON Schema で検証予定、差分は `scripts/plan-validator.ts` を設計。

---

## Alternative Approaches Considered
| アプローチ | 長所 | 短所 | 判断 |
| --- | --- | --- | --- |
| Supabase Edge 内で完結（GitHub Actions を使用せず） | リアルタイム性, 単一コンポーネント | GitOps/監査性欠如, 仕様駆動が崩れる | 不採用 |
| Manus を本番自動化にも常時利用 | 実装工数削減 | コストと外部依存増大, 監査難 | 不採用 |
| Datastore を Cloud SQL/Firestore 等へ移行 | 拡張性, ACID | 初期費用・複雑性増 | MVP 段階ではGoogle Sheets + Supabaseで十分 |

---

## Risks & Mitigations
| リスク | 内容 | 緩和策 |
| --- | --- | --- |
| KPI 定義が未合意 | 40% 目標に向けた指標が不明確 | 週次レポート実装前にマーケチーム会議で KPI/責任者を確定 |
| Google Sheets API quota | 大量更新時にレート制限 | バッチ書き込み＋リトライ、閾値超過時は Supabase バックアップ |
| Plan JSON の未承認変更 | 仕様駆動が崩れる可能性 | `plan-validator` ワークフローで差分検証＋CODEOWNERSで承認必須 |
| Budget guard 無効化 | 経済的リスク | `economic-circuit-breaker.yml` を cron + manual で両方起動、閾値超過で Slack/メール通知 |
| セキュリティ | HASH_SALT 未設定や Secrets 漏洩 | `HASH_SALT` を必須化（デプロイ前チェック）、GitHub Actions の OIDC/環境分離 |
| Deno 未導入 | ユニットテスト未実行 | CI（GitHub Actions）に `deno setup` ステップ追加、ローカルにも導入ガイドを整備 |

---

## Deliverables
- **Front Door 強化**: timing-safe 署名検証、塩付きハッシュ、将来的な idempotency キャッシュ追加方針。
- **Plan 運用フロー**: `line-event.yml` と `manus-progress.yml` に Plan JSON/PlanDelta 処理、budgetチェック、通知導線を実装。
- **Plan ガバナンス**: `scripts/plan/validate-plan.js` と `plan-validator.yml` で Plan JSON の構造検証、`CODEOWNERS` で差分レビューを必須化。
- **データスキーマ**: Google Sheets 列定義と Supabase テーブル（`progress_events`, `budget_snapshots`）。マイグレーションファイルを `database/migrations/` に配置。
- **テスト戦略**:
  - Unit: Front Door（署名、サニタイズ）、`cost.py`、Plan validator。
  - Integration: GitHub Actions workflow の dry-run (`act` や workflow dispatch テスト)、LINE API モックを使った返信確認。
  - E2E: note CTA → LINE follow → GitHub Actions → Sheets/Supabase 更新 → KPI レポート生成までの手動/自動テスト。
- **デプロイ考慮**:
  - Supabase Edge へ `supabase functions deploy relay`、`supabase secrets set` で環境変数登録。
  - GitHub Secrets/Variables の整備チェックリスト作成。
  - GitHub Actions ダッシュボードの監視と通知ルール設定（週次確認＋アラート）。

---

## Open Questions & Follow-ups (Design Perspective)
- KPI レポートの責任者と配信先（Slack/メール）の最終決定が必要。
- Google Sheets 書き込みに Manus CLI を利用するか、Service Account 経由で自前実装するか要判断。
- Supabase をどの範囲で必須とするか（ログのみ or 将来メイン DB へ移行）。
- `.claude` や Miyabi スクリプトの統合度合い（仕様に組み込むか補助的に留めるか）。

ステークホルダー承認後、タスク分解 (`/sdd-tasks`) に進む。

## Final Implementation Notes
- Front Door ハンドラと Plan 運用フローは実装済みで、LINE 署名検証・PlanDelta 生成・production Plan 切替は稼働可能。
- Manus Progress 解析はログ出力まで整備したが、`decision: retry/amended` に紐づく Manus API 再実行は未接続でフォローアップが必要。
- 経済サーキットブレーカーは `BUDGET.yml` のしきい値計算と GitHub Issue 通知を備えるが、実コスト取得はダミー値のままで代替ルート切替も未実装。
- KPI レポートワークフローと Supabase RPC スタブは用意済みだが、`line_conversion_kpi` の計測対象データが未投入のため現状はゼロ値レポートとなる。
- 監査ログとデータストア向けのマイグレーションは整備済みで、Supabase 本番適用とSheets同期のオペレーション手順が次イテレーションに残る。
