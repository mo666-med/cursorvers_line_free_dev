# Tasks – Cursorvers LINE Funnel

| # | タイトル / 目的 | 主担当 (想定) | 参照デザイン節 | 依存 | 定義済み成果物・DoD | ステータス |
|---|----------------|---------------|-----------------|------|----------------------|------------|
| T1 | Front Door セキュリティ強化<br>HASH_SALT・署名検証を本番化し Deno テストを CI に追加 | Backend (Edge) | Architecture Overview → Front Door | なし | `functions/relay/index.ts` に timing-safe 検証と塩付きハッシュを実装、`functions/relay/index.test.ts` を `deno-tests.yml` で常時実行 | Done |
| T2 | Plan JSON 運用フロー整備<br>`line-event.yml` の plan load / PlanDelta 生成 / production 切替 | DevOps (Actions) | Architecture Overview → GitHub Actions (`line-event.yml`) | T1 | `line-event.yml` に dev/prod 分岐・PlanDelta生成、`orchestration/plan/production/current_plan.json` を配置、workflow_dispatch で確認 | Done |
| T3 | Manus Progress ハンドリング強化<br>`manus-progress.yml` の PlanDelta 解析と再実行制御 | DevOps | Architecture Overview → GitHub Actions (`manus-progress.yml`) | T2 | ProgressEvent を `logs/progress/` に保存しつつ PlanDelta を判定、`retry`/`amended` のみ Manus 再実行 | Partial (re-run call pending) |
| T4 | 経済サーキットブレーカー連携<br>`economic-circuit-breaker.yml` + `BUDGET.yml` で Manus 停止制御 | DevOps/Finance | Architecture Overview → GitHub Actions (`economic-circuit-breaker.yml`) | T2 | 80%/150% 閾値で警告・`MANUS_ENABLED` 変数更新・ワークフロー停止、Slack/Issue通知パス整備 | Partial (cost ingestion stub) |
| T5 | Manus 自動トリガー実装<br>`manus-task-runner.yml` で週次 Manus 起動/停止制御 | DevOps | Architecture Overview → GitHub Actions (`manus-task-runner.yml`) | T2, T4 | `manus-task-runner.yml` が週次・`repository_dispatch` で Plan/Brief を送信、`MANUS_ENABLED=false` でスキップ | Done |
| T6 | データストア整備<br>Supabase マイグレーション & Google Sheets ガイド作成 | Data/Infra | Deliverables → データスキーマ | T2 | `database/migrations/0001_init_tables.sql` をベースに進捗・予算テーブル作成、`docs/DATA_MODEL.md` で Sheets 列仕様を明文化、ステージング適用記録 | Partial (migration staged only) |
| T7 | LINEイベント→Google Sheets 自動反映<br>サービスアカウント連携 | DevOps/Data | Architecture Overview → GitHub Actions (`line-event.yml`), Data Stores | T6 | Secrets (`GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`) で `scripts/sheets/upsert-line-member.js` が `line_members` タブへアップサート、workflow_dispatch で動作記録 | Done |
| T8 | KPI レポート & 週次ワークフロー実装<br>40% 目標の可視化 | Marketing Ops | Architecture Overview → KPI レポート | T6, T7 | `weekly-kpi-report.yml` が Supabase RPC / Sheets から指標取得し `logs/kpi/` に保存、通知先とRunbook更新 | Partial (RPC wired, data missing) |
| T9 | Plan JSON ガバナンス<br>`plan-validator` 追加と CODEOWNERS 査読必須化 | DevOps | Risks & Mitigations → Plan JSON / Deliverables → Plan運用 | T2, T3 | `scripts/plan/validate-plan.js` による構造チェック、`plan-validator.yml` ワークフロー追加、CODEOWNERS でレビュー必須化 | Done |
| T10 | 監査ログ・ログ退避パイプライン<br>Supabase → GitHub Artifacts / Drive | Ops/Data | Deliverables → データスキーマ / Risks → Google Sheets quota | T6 | Supabase `budget_snapshots` & `progress_events` へ保存、`economic-circuit-breaker.yml` の結果も記録、退避用ワークフロー案を docs に記述 | Not Started |
| T11 | 通知・Runbook 更新<br>失敗時復旧と Slack/Email 回線整備 | Ops | Deliverables → デプロイ考慮 / Risks → Budget guard | T4, T8, T10 | `docs/RUNBOOK.md` に最新手順追記、Slack/メール通知アクション設定 (`workflow_dispatch` 含む)、テスト結果記録 | Not Started |
| T12 | テストパイプライン強化<br>Unit / Integration / E2E | QA/Dev | Deliverables → テスト戦略 | T1〜T8 | `deno-tests.yml`, `python-tests.yml`, `npm` スクリプト整備、`docs/TESTING.md` にE2E手順、`act` 等でdry-run記録 | Partial (python only) |

### 並行可能性と依存関係
- **Phase 1（基盤）**: T1–T3–T5 完了済。T4 の最終仕上げ後にコスト制御がフル稼働。
- **Phase 2（データ／KPI）**: T6・T7→T8 の順で進める。T6 は Supabase スキーマ適用と Sheets ガイド整備が前提。
- **Phase 3（ガバナンス／監査）**: T9 と T10 は T6 の成果を引き継ぎ並行可能。T11 は T4/T8/T10 結果を反映して仕上げる。
- **Phase 4（品質）**: T12 は全期間を通じて継続。Plan validator (T9) 完了後に追加テストケースを組み込む。

### 関連資料
    - Requirements: `.sdd/specs/archives/2025-11-01-line-funnel/requirements.md`
    - Design: `.sdd/specs/archives/2025-11-01-line-funnel/design.md`
- Runbook: `docs/RUNBOOK.md`
- Data Model: `docs/DATA_MODEL.md`
- Cost / Plan assets: `orchestration/`
    - Google Sheets ガイド: follow-upドキュメント未作成（T6/T8 引き継ぎ）

### ブロッカー / メモ
- KPI 指標の最終合意と通知先（Slack/メール）の決定が T8/T11 の前提。
- Supabase / Sheets サービスアカウント Secrets を本番環境に登録する必要あり。
- `MANUS_ENABLED` 変数運用フロー（サーキット解除手順）を Runbook で明文化すること。
- Deno 実行環境がローカルにないため、CI 結果を主としたテスト運用。必要であればローカル導入ガイドを整備。
