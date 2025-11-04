# Design – Cursorvers LINE Funnel

## Scope & Context
Cursorvers の LINE ファネルは、note 記事から流入したユーザーを友だち登録〜情報提供〜コンサルティングへと誘導するマーケティング自動化基盤である。医療安全ガードレールを保ちつつ、GitHub Actions を中心とした GitOps フローで運用し、Manus はポイント効率の高い「最終処理」に限定する。本設計は以下のコンポーネントを対象にする。

- Supabase Edge Function（もしくは Cloudflare Workers）上で稼働する Front Door（TypeScript/Deno）
- GitHub Actions ワークフロー群（`line-event.yml`, `manus-progress.yml`, `economic-circuit-breaker.yml`, `weekly-kpi-report.yml`, `node-tests.yml`, `verify-secrets.yml` など）
- Orchestration スクリプト（`scripts/` 以下の Supabase/Sheets/KPI/Manus/Secrets ユーティリティ）
- データストア（Supabase、Google Sheets、GitHub Logs/Artifacts）
- テスト／運用ツール（`act` シナリオ、CI、Secrets チェッカー、Progress Event リプレイ）
- レガシーの `Cursorvers_LINEsystem/`（Miyabi フレームワーク）は参照のみとし、現在の GitHub Actions 中心アーキテクチャには組み込まない。

## Requirements Trace & Scope Alignment
- Requirements reference: `.sdd/specs/line-funnel/requirements.md` (2025-11-04) — all open questions resolved (D1–D5). No additional stakeholder clarifications pending before implementation.
- Business outcomes: GitHub Actions-first automation, safety guardrails, Google Sheets + Supabase dual-write, optional Manus execution with cost governance.
- MVP out-of-scope: automatic segmentation beyond CTA tags, persistent degraded-mode analytics, legacy `Cursorvers_LINEsystem/` flows.

## Architecture Overview

### System Boundaries & Data Flow
```
note CTA ─▶ LINE 友だち追加 ──▶ Front Door (Supabase Edge / Cloudflare Workers)
                               (Verify signature, sanitize, dedupe, dispatch)
                                   │ repository_dispatch (event_type=line_event | manus_progress)
                                   ▼
                          GitHub Actions Orchestration
        ┌────────────────────┬──────────────────────┬──────────────────────┐
        │                    │                      │                      │
 line-event.yml    manus-progress.yml   economic-circuit-breaker.yml   weekly-kpi-report.yml
  (Plan 実行)        (PlanDelta反映)        (予算監視→degrade)            (Supabase KPI 集計)
        │                    │                      │                      │
        │────────────┬───────┘                      └──────┬───────────────┘
        ▼            ▼                                      ▼
Google Sheets   Supabase (progress_events, line_members, budget_snapshots, kpi_snapshots)
        │                                                         │
        └───────────────▶ GitHub Artifacts / Logs ◀───────────────┘
                                         │
                                  Monitoring / Alerts (ProgressEvent v1.1,
                                  Step Summary, verify-secrets, Slack/discussion)
```

### Component Responsibilities
- **External boundaries**  
  - LINE Messaging API (webhook events & replies).  
  - Manus API (optional task execution with ProgressEvent v1.1).  
  - Supabase REST/PostgREST (progress_events, line_members).  
  - Google Sheets API (transitional CRM ledger).

- **Front Door (Supabase Edge Function / Cloudflare Workers, TypeScript/Deno)**
  - LINE の X-Line-Signature を HMAC-SHA256 で検証、Manus Progress は Bearer Token を比較。
  - ユーザー ID を `HASH_SALT` 付き SHA-256 でハッシュ化し、PHI を除去。必要に応じてメッセージテキストのマスキング。
  - KV ストア（Supabase Deno KV / Workers KV）で `dedupe_key` を保持し重複排除。
  - 正常化した payload を GitHub `repository_dispatch` へ送信する。

- **GitHub Actions ワークフロー**
  - `line-event.yml`︓payload の解析 → Plan JSON (`orchestration/plan/production/*.json`) 選択 → `orchestration/cost.py` による予算チェック → Supabase/Google Sheets 更新 → LINE Messaging API 呼び出し → Manus API（開発モードのみ）。
  - `manus-progress.yml`︓PlanDelta JSON を解析し、`retry`/`amended`/`abort` で Manus 再試行や停止を制御。Supabase `progress_events` を更新、Push Telemetry を生成。
  - `economic-circuit-breaker.yml`︓`scripts/budget/*` のモック／本番データを集計し、`BUDGET.yml` の閾値に応じて `MANUS_ENABLED` や `degraded.flag` を切り替える。
  - `weekly-kpi-report.yml`︓`scripts/kpi/generate-kpi-report.js` を実行し、Supabase RPC `line_conversion_kpi` を呼出 → Markdown/JSON を生成 → Step Summary と Artifact に出力。
  - `node-tests.yml` / `deno-tests.yml` / `python-tests.yml`︓CI パイプラインで自動テストを実行。
  - `verify-secrets.yml`︓`scripts/verify-secrets.sh` を呼び出し、Secrets/Variables の設定漏れを検知。

- **Orchestration Scripts**
  - `scripts/supabase/*`︓Supabase REST API への書き込み（LINE イベント、Manus Progress、Budget Snapshot 等）。
  - `scripts/sheets/*`︓Google Sheets のアップサート（サービスアカウント経由、欠損時はスキップ）。
  - `scripts/kpi/generate-kpi-report.js`︓KPI 集計・Markdown 生成。Node --test 対応。
  - `scripts/replay-progress-event.ts`︓GitHub Actions 上で過去イベントを再生。

### Messaging Cadence & Segmentation Policy
- **配信頻度**: 同一ユーザーへの自動配信は 1 日 1 回まで、週次では 3 回までを上限とする。`line-event.yml` が `dedupe_key` と `retry_after_seconds` を調整し、ガードレールを超える場合は PlanDelta 側でリトライ抑制する。
- **例外運用**: イベント告知や緊急メンテナンスなど運用チームが承認したケースのみ例外配信を許可し、`logs/progress/` にメモを残す。
- **セグメント戦略**: 初期リリースは全ユーザー一律配信で運用し、CTA タグ（`cta_tags`）を基に Ops が手動セグメントをテスト。エンゲージメント指標（開封率等）を基にした自動セグメントは Phase 後半で追加予定。
- **担当/レビュー**: Product/Ops が月次で KPI を確認し、必要に応じて制限値やセグメントルールを更新。更新内容は `.sdd/specs/line-funnel/decisions.md` に追記し、Runbook に反映する。
  - `scripts/verify-secrets.sh`︓CLI/GitHub 設定（gh CLI, Supabase CLI, Secrets, Variables）のチェック。
  - `.github/workflows/.act/*`︓`act` CLI 用の通常/縮退/Manus Progress シナリオ。

- **データストア**
  - **Supabase**︓`progress_events`, `line_members`, `budget_snapshots`, `kpi_snapshots` テーブルと `line_conversion_kpi()` RPC を中心に活用。Service Role Key で write、Supabase 側で JSONB により冪等性/再試行情報を保持。
  - **Google Sheets**︓段階的移行のための interim CRM（ハッシュ化 ID, ステージ, タグ, 登録日時等）。手作業でも参照可能。
  - **GitHub Logs / Artifacts**︓Supabase 障害時のバックアップストレージ、および KPI Markdown/JSON を保存。

### Technology Choices
- **Runtime**：Supabase Edge (Deno) を公式サポート対象に、Cloudflare Workers を fallback とする。
- **Workflow orchestration**：GitHub Actions + Plan JSON（仕様駆動開発）で監査性を確保。
- **Persistence**：短期は Sheets と Supabase の二重更新で監査性・利便性を両立。中長期で Supabase を主系に移行。
- **Messaging**：LINE Messaging API は guardrail フッターを強制付与。Manus は Gmail/Calendar など最小限のコネクタ利用に留める。
- **Testing**：`act` + Node/Deno/Python のネイティブテスト、GitHub Actions CI を組み合わせる。

### Alternatives Considered
| アプローチ | 検討結果 |
| --- | --- |
| フロントドア以外もすべて Edge/Serverless に寄せる | GitOps と監査ログを重視し Actions 中心を選択。Edge 側は薄く保つ。 |
| 完全 Manus 自動化 | ポイント消費と安全性の観点で最終手段。現在は Actions 内の自動化＋手動フォールバックで徐々に利用する。 |
| Google Sheets を初期から外す | マーケチームの運用都合で暫定残留。Supabase への一本化は Phase3 タスクで対応。 |
| Progress Pull モデル | API コストと遅延が大きいため、Manus ProgressEvent push を採用。 |

## Data Models & API Contracts

### Supabase テーブル
- `progress_events`:  
  `id`, `source (line|manus)`, `user_hash`, `plan_id`, `plan_version`, `plan_variant (production|degraded|manual)`, `event_type`, `payload JSONB`, `decision (proceed|retry|amended|abort)`, `cost_estimate`, `manus_points_consumed`, `retry_after_seconds`, `dedupe_key`, `manus_run_id`, `status (queued|running|complete|failed)`, `evidence JSONB`, `correlation_id`, `recorded_at`, `created_at`, `updated_at`。
- `line_members`:  
  `user_hash`, `first_opt_in_at`, `last_opt_in_at`, `cta_tags text[]`, `status (lead|active|engaged|churned)`, `guardrail_sent_at`, `consent_guardrail`, `metadata JSONB`, `created_at`, `updated_at`。
- `budget_snapshots`:  
  `period_start`, `period_end`, `vendor_costs JSONB`, `threshold_state (normal|warn|trip)`, `mode (normal|degraded)`, `total_cost`, `notes`, `created_at`。
- `kpi_snapshots`:  
  `week_start`, `total_subscribers`, `paid_conversions`, `conversion_rate`, `goal_met`, `raw_counts JSONB`, `notes`, `created_at`。
- RPC `line_conversion_kpi(start_date, end_date)`︓週次 KPI 集計を返却（`start_date`/`end_date` は省略可）。`scripts/kpi/generate-kpi-report.js` が利用。

### Repository Dispatch Payload
```json
{
  "event_type": "line_event",
  "client_payload": {
    "event_id": "2025-11-03T22:59:38.752Z-U123456789",
    "received_at": "2025-11-03T22:59:38.752Z",
    "signature_valid": true,
    "dedupe_key": "sha256(...payload...)",
    "events": [
      {
        "type": "follow",
        "timestamp": 1700000000000,
        "source": { "type": "user", "userId": "5b23...hashed..." },
        "replyToken": "abcd",
        "message": null
      }
    ]
  }
}
```

### Manus Progress Payload
```json
{
  "event_type": "manus_progress",
  "client_payload": {
    "progress_id": "run-5f4a",
    "decision": "retry",
    "retry_after_seconds": 900,
    "plan_variant": "production",
    "manus_points_consumed": 12.4,
    "metadata": {
      "reason": "LINE endpoint timeout",
      "last_message_id": "msg-123"
    }
  }
}
```
- `retry_after_seconds` はオプション。存在する場合は `manus-progress.yml` が `workflow_run` をスケジュールし再試行する。
- `plan_variant` により `orchestration/plan/production/*.json` か `degraded_plan.json` を選択。
- `manus_points_consumed` は `budget_snapshots` の計算に反映される。

### Google Sheets ワークシート
- シート名（想定）︓`LINE Funnel CRM`
- 列構成︓`user_hash` / `first_opt_in_at` / `last_opt_in_at` / `status` / `cta_tags` / `last_message` / `last_event_type` / `raw_payload`
- 上書き戦略︓`Hashed ID` をキーに upsert。API rate-limit 超過時は Supabase へ退避し、`weekly-kpi-report.yml` が欠損件数を Step Summary で報告。
- 保持／アクセス方針︓Supabase へ完全移行するまでアクティブデータは無期限保持。移行完了後は 6 か月でアーカイブ削除。編集権限は Tech Lead / Ops Lead、閲覧権限は Marketing／Product に限定し、Google Workspace Admin の監査ログを有効化する。`scripts/reconcile-ledgers.ts`（計画中）が月次で Supabase と照合し、重大な差分は Slack 通知する。

### KPI Report 出力
- `tmp/kpi.json`: Supabase RPC 結果＋目標値、ステータス。
- `tmp/kpi.md`: Markdown summary（Step Summary に追記）。
- Step Summary 例：
  ```
  ### 📊 Weekly KPI Report (2025-10-28 – 2025-11-04)
  - Total new subscribers: 42
  - Paid conversions: 18
  - Conversion rate: 42.86% (target 40%)
  - Status: ✅ Target met
  ```

### Secrets / Variables
- `vars`: `SUPABASE_URL`, `DEVELOPMENT_MODE`, `MANUS_ENABLED`, `MANUS_BASE_URL`, `DEGRADED_MODE`, `SUPABASE_URL_STAGING` 等。
- `secrets`: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY_STAGING`, `MANUS_API_KEY`, `LINE_CHANNEL_SECRET`, `PROGRESS_WEBHOOK_URL`, `NOTIFY_WEBHOOK_URL`, `GOOGLE_SERVICE_ACCOUNT_JSON` など。
`scripts/verify-secrets.sh` および `verify-secrets.yml` が存在をチェックする。

## Testing Strategy
| レベル | 対象 | 実装 / ツール |
| --- | --- | --- |
| Unit (Edge) | Front Door 署名検証、sanitize、dedupe | `functions/relay/index.test.ts` (Deno) |
| Unit (Node) | Supabase schema/KPI/Budget/Plan validation | `tests/node/*.test.mjs` |
| Unit (Python) | `orchestration/cost.py`、経済サーキットブレーカロジック | `pytest` |
| Integration (Actions) | `line-event.yml`・`manus-progress.yml`・`economic-circuit-breaker.yml` | `.github/workflows/.act/*` + `scripts/test-act-scenarios.sh` |
| Integration (Manus) | 再試行マトリクス 5 ケース | `tests/manus-progress-matrix.test.mjs` |
| Integration (Budget) | CSV/JSON モックでコスト集計→degrade | T7 ドリル (`scripts/test-circuit-breaker-drill.sh`) |
| Integration (Secrets) | 設定漏れ検知 | `verify-secrets.yml` (GH Actions) |
| KPI | Supabase 成功/失敗シナリオ、Step Summary 出力 | `weekly-kpi-report.yml` |
| E2E | note → LINE follow → Sheets/Supabase 更新 → Manus fallback | `act` シナリオ/本番 dry-run (`workflow_dispatch`) |

CI は GitHub Actions で Node/Deno/Python/Secrets チェックを走らせ、PR の必須条件として設定する。ローカルでは `npm test`, `deno test`, `python -m pytest` を `act` と併用して再現性を確保。

## Degraded / Manual Fallback Operations
- `economic-circuit-breaker.yml` が Manus コスト超過を検知した場合は `degraded.flag` を作成し、`MANUS_ENABLED=false` を設定して自動で縮退モードへ移行。
- 縮退時は `docs/alerts/line_degraded_outreach.ics` を `line-event.yml` から通知し、Ops Lead が 24 時間以内に対象リードへ手動フォローする。フォロー進捗は `logs/progress/` に追記し、`weekly-kpi-report.yml` が欠損件数をサマリする。
- PlanDelta が `retry` 指示を返しても縮退モードでは Manus 再試行をブロックし、Ops が Slack `#line-ops` で対応者をアサインする。
- フォールバック手順と担当者は `.sdd/specs/line-funnel/decisions.md (D3)` と `docs/RUNBOOK.md` に同期し、月次レビューで更新する。

## Deployment & Migration Considerations
1. **環境準備**
   - Supabase CLI, gh CLI のインストールと認証 (`supabase login`, `gh auth login`)。
   - Secrets/Variables を `docs/ENV_VAR_SETUP.md` に従って設定し、`scripts/verify-secrets.sh` で検証。
2. **Front Door デプロイ**
   - `supabase functions deploy relay --project-ref <ref>`。KV (`HASH_SALT`, `FEATURE_BOT_ENABLED`, `GH_PAT`) を設定。
   - LINE Developers で Webhook URL を Edge に差し替え、Manus Progress も同様。
3. **GitHub Actions 有効化**
   - `line-event.yml`, `manus-progress.yml`, `economic-circuit-breaker.yml`, `weekly-kpi-report.yml` などを有効化し、concurrency と branch protection を設定。
   - `node-tests.yml`, `deno-tests.yml`, `python-tests.yml`, `verify-secrets.yml` を必須チェックに追加。
4. **データ移行**
   - 既存の LINE 会員データをハッシュ化して Sheets に取り込み。
   - Supabase に必要テーブルを作成（`database/migrations/**`）。`supabase db push` でデプロイ。
   - `kpi_snapshots` に初期データ（過去 KPI）を登録する場合は `scripts/kpi` で実装。
5. **ドライランとモニタリング**
   - `act` で通常/縮退のワークフローを確認し、`economic-circuit-breaker` ドリル、`weekly-kpi-report` の手動実行を実施。
   - UptimeRobot や Slack 通知を設定し、ProgressEvent エラーが可視化されるようにする。
6. **ロールバック**
   - 緊急停止は Supabase Edge の環境変数 `FEATURE_BOT_ENABLED=false`、GitHub `MANUS_ENABLED=false`、`degraded.flag` の削除で復旧。

## Log Retention & Rotation
- `scripts/rotate-logs.sh` が `logs/progress/` の JSON を 90 日保持・月次アーカイブ・1 年後削除する。macOS/BSD と GNU の `date` に対応させた実装で、週次スケジュール (`rotate-logs.yml`) と手動実行 (`workflow_dispatch`) をサポート。
- アーカイブは `logs/progress/archive/YYYY-MM/*.json.gz` に格納し、`git count-objects` を用いたリポジトリサイズ監視で 100MB/200MB の警告・強制アーカイブ閾値を設ける。
- GitHub Actions で実行した場合のみ自動コミット／プッシュを行い、ローカル実行では単にファイルを整理する。Runbook に確認手順を追記し、四半期レビューで保持期間を再評価する。

## Risks & Mitigations
| リスク | 影響 | 対応 |
| --- | --- | --- |
| Supabase 認証/接続失敗 | KPI や進捗ログが欠落 | `status` フィールドで検知し Step Summary で警告。Fallback として GitHub アーティファクト保存。 |
| Google Sheets API 制限 | CRM 記録漏れ | リトライ、Supabase へのバックアップ計画、Slack 通知。 |
| Manus コスト超過 | 自動タスク失敗 | `economic-circuit-breaker` による degrade、`MANUS_ENABLED=false`、ICS ルート活用。 |
| Secrets/Variables 不備 | Actions 失敗・情報漏洩 | `verify-secrets.sh` / `verify-secrets.yml` による定期チェック。 |
| Guardrail 付与漏れ | コンプライアンス違反 | テンプレート化と lint/Unit Test で強制。 |
| act シナリオの劣化 | ローカル検証不可 | `.github/workflows/.act/*` を PR で保守。README に手順記載。 |
| Supabase/Sheets データ不整合 | KPI や CRM の信頼性低下 | Phase3 T12 で照合自動化予定、暫定として手動チェック表を維持。 |

## Next Steps Toward `/sdd-tasks`
1. PR #5 (Phase1) と PR #6 (Phase2) をマージし、`main` を同期。
2. KPI レポートの配信先（GitHub Discussions / Slack）の最終合意とワークフロー拡張。
3. Phase3 タスク（T12〜T14）︓Supabase↔Sheets 照合自動化、夜間セキュリティスキャン、ステークホルダー決定ログ整備。
4. 決定済みの Sheets 保持方針・ログローテーション手順を `docs/RUNBOOK.md` / `docs/PRODUCTION_AUTO_RUN.md` に反映し、Ops チームへ周知。
5. 本番ローンチ前に `/docs/POST_MERGE_VERIFICATION.md` を活用した最終チェックリストを実施。
