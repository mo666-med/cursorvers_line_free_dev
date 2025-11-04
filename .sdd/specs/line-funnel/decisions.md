# Decision Log – Cursorvers LINE Funnel

このドキュメントは、Open Questionsに対する決定事項を記録します。

## 決定事項

### D1: LINE配信の頻度とセグメント戦略（2025-01-XX）

**決定**: デフォルト方針を設定し、段階的に最適化

- **頻度制限**: 
  - 同一ユーザーへの配信は最大1日1回
  - 週次配信は最大3回まで
  - 緊急通知（イベント告知等）は例外として許可
- **セグメント戦略**:
  - 初期は全ユーザー一律配信
  - 段階的にCTAタグベースのセグメント化を実装
  - エンゲージメント（メッセージ開封率、クリック率）に基づくセグメント化は将来実装
- **実装場所**: `line-event.yml` の `dedupe_key` と `retry_after_seconds` で制御
- **担当**: Product/Ops
- **レビュー**: 月次でKPIに基づき見直し

**参考**: `.sdd/specs/line-funnel/requirements.md:46`

---

### D2: Google Sheets台帳の保持期間・アクセス権限・監査ポリシー（2025-01-XX）

**決定**: デフォルト方針を設定

- **保持期間**: 
  - アクティブデータ: 無期限（Supabase移行完了まで）
  - アーカイブデータ: 移行後6ヶ月間保持、その後削除
- **アクセス権限**:
  - 編集権限: Tech Lead, Ops Lead のみ
  - 閲覧権限: マーケチーム、Product Lead
  - 監査ログ: Google Workspace Admin で有効化
- **監査ポリシー**:
  - 月次でSupabaseとの整合性チェック（`scripts/reconcile-ledgers.ts`）
  - 重大な不一致はSlack通知
  - アクセスログはGoogle Workspace Adminで確認
- **移行計画**: 
  - 2025年Q2までにSupabaseへの完全移行を目指す
  - 移行後も6ヶ月間はSheetsをバックアップとして保持
- **担当**: Data/Infra
- **レビュー**: 四半期ごと

**参考**: `.sdd/specs/line-funnel/requirements.md:47`

---

### D3: Manus停止時のフォールバック手順と担当（2025-01-XX）

**決定**: ICSテンプレートと手動フォロー手順を確定

- **フォールバック経路**:
  1. **自動フォールバック**: `economic-circuit-breaker.yml` が `degraded.flag` を設定
  2. **ICS配信**: `docs/alerts/line_degraded_outreach.ics` を自動生成・配信
  3. **手動フォロー**: Ops Lead が24時間以内にフォロー開始
- **担当者**:
  - **一次担当**: Ops Lead
  - **二次担当**: Product Lead
  - **エスカレーション**: Tech Lead（技術的問題の場合）
- **手順**:
  1. `logs/progress/` から対象イベントを確認
  2. Slack `#line-ops` にて担当者を割り当て
  3. 24時間以内にフォロー完了報告を `logs/progress/` に追記
  4. 安全ガードレールを遵守（医療に関する個別助言は行わない）
- **監視**: 
  - `weekly-kpi-report.yml` が欠損件数をStep Summaryで報告
  - 手動フォロー件数は月次レポートに含める
- **担当**: Ops Lead
- **レビュー**: 月次でフォロー品質を確認

**参考**: 
- `.sdd/specs/line-funnel/requirements.md:48`
- `docs/alerts/line_degraded_outreach.ics`
- `orchestration/plan/production/degraded_plan.json`

---

### D4: Actionsがコミットするlogs/progressのローテーション/アーカイブ方針（2025-01-XX）

**決定**: 自動ローテーションスクリプトを実装

- **保持期間**:
  - **アクティブログ**: 直近90日分を `logs/progress/` に保持
  - **アーカイブログ**: 90日超過分は `logs/progress/archive/` に移動
  - **完全削除**: 1年超過分は自動削除（Git履歴には残る）
- **ローテーション方式**:
  - 週次で `scripts/rotate-logs.sh` を実行
  - `weekly-kpi-report.yml` の実行後に自動実行
- **アーカイブ形式**:
  - 月次でアーカイブ: `logs/progress/archive/YYYY-MM/`
  - 圧縮: `.json.gz` 形式で保存
- **リポジトリサイズ管理**:
  - リポジトリサイズが100MBを超える場合は警告
  - 200MBを超える場合は自動アーカイブを実行
- **実装**:
  - `scripts/rotate-logs.sh`: ログローテーションスクリプト
  - `.github/workflows/rotate-logs.yml`: 週次実行ワークフロー
- **担当**: DevOps
- **レビュー**: 四半期ごとにリポジトリサイズを確認

**参考**: 
- `.sdd/specs/line-funnel/requirements.md:49`
- `docs/RUNBOOK.md` (ログ管理セクション)

---

### D5: Cursorvers_LINEsystem/ディレクトリの現行用途（2025-01-XX）

**決定**: レガシープロジェクトとして扱い、現在の実装では使用しない

- **現状**: 
  - `Cursorvers_LINEsystem/` はMiyabiフレームワークを使用した別プロジェクト
  - 既に `.gitignore` に追加済み（Git管理対象外）
- **扱い**:
  - **現在の実装では使用しない**: GitHub Actions中心の実装を継続
  - **アーカイブ**: レガシープロジェクトとして認識し、必要に応じて別リポジトリに移行検討
  - **削除**: 現在は削除せず、将来の移行時に検討
- **理由**:
  - 現在の実装はGitHub Actions中心で十分に機能している
  - Miyabiフレームワークとの統合は複雑性を増す
  - 既存の実装との競合を避ける
- **将来の検討事項**:
  - 別リポジトリとして独立させる
  - または完全に削除
- **担当**: Tech Lead
- **レビュー**: 2025年Q2に再評価

**参考**: 
- `.sdd/specs/line-funnel/requirements.md:50`
- `.gitignore` (Cursorvers_LINEsystem/ が追加済み)
- `Cursorvers_LINEsystem/README.md` (Miyabiフレームワークの説明)

---

## 決定待ち事項

現時点で決定待ちの事項はありません。すべてのOpen Questionsに対する決定が完了しました。

## 決定プロセス

1. **提案**: ステークホルダーがOpen Questionsを提起
2. **検討**: 関連ドキュメント（requirements.md, design.md）を参照
3. **決定**: Tech Lead, Product Lead, Ops Lead が合意形成
4. **記録**: このドキュメントに決定事項を記録
5. **実装**: 決定事項に基づいて実装を進める
6. **レビュー**: 定期的（月次/四半期）に決定事項を見直し

## 関連ドキュメント

- `.sdd/specs/line-funnel/requirements.md`: 要件定義（Open Questionsセクション）
- `.sdd/specs/line-funnel/design.md`: 設計ドキュメント
- `.sdd/specs/line-funnel/tasks.md`: タスク定義
- `.sdd/specs/line-funnel/traceability.md`: 要件追跡性

