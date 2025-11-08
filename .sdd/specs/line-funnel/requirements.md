# Cursorvers LINE Funnel – Requirements

## Business Objectives
- Convert note article readers into LINE subscribers at ~40% opt-in, then nurture them toward consulting engagements (events, advisory retainers).
- Maintain medical safety guardrails: no individual diagnoses, always append standardized disclaimer, encourage emergency care when needed.
- Center the operational runbook on GitHub Actions (repository_dispatch driven) for planning, ingestion, notifications, and telemetry, while keeping Manus usage constrained to “last-mile” automations to control point spend.

## Functional Requirements
1. Accept webhooks from LINE and Manus via Front Door (Edge/Workers) with signature verification and idempotency handling; ensure dedupe cache via KV fallback to memory.
2. Dispatch validated events into GitHub via `repository_dispatch`, triggering Actions workflows that own plan selection, data persistence, messaging, and telemetry.
3. Automate outbound LINE messaging (via GitHub Actions scripts) for:
   - New note article announcements.
   - Distribution of supplementary materials (e.g., guides) upon request.
   - Promotional notifications for events, webinars, or advisory services.
   Messages must include safety guardrail footer.
4. Store LINE subscriber metadata (hashed identifiers, subscription timestamps, tags) in Google Sheets for interim CRM and auditing; Supabase remains system of record for progress events.
5. Provide cost estimation and degradation: call Manus cost estimator before external actions; degrade to LINE + ICS fallback if daily/weekly budget thresholds breached or feature flags disable Manus.
6. Offer real-time progress telemetry via push notifications (ProgressEvent v1.1) into GitHub/monitoring with Actions summarising state in job summaries.
7. Persist canonical event and progress logs back into the repo via Actions commits (with lifecycle policy defined) for auditability while monitoring repo growth.

## GitHub Actions Requirements
- **Trigger Surface**: `line-event.yml` and `manus-progress.yml` respond to `repository_dispatch`; additional workflows (budget governor, SLO monitor, weekly reports, project sync) continue to operate on schedule or issue triggers.
- **Plan Management**: Actions must load production or degraded plans (`orchestration/plan/...`) based on feature flags (`MANUS_ENABLED`, `DEGRADED_MODE`, flag files). Development mode retains PlanDelta generation for simulation.
- **Secrets & Vars**: All workflows rely on organization/repo `vars` and `secrets`; document required keys (Supabase, Google service account, Manus, notification webhooks) and enforce existence checks with graceful skips.
- **Data Persistence**: `line-event` workflow invokes Node scripts to upsert Supabase `progress_events` / `line_members` and update Google Sheets ledger; failure must short-circuit Manus dispatch and surface alerts.
- **Cost Governance**: `orchestration/cost.py` executed in-line; non-compliant plans trigger warnings and optional degraded paths.
- **Retry/Degrade Logic**: `manus-progress.yml` interprets Manus decisions and optionally calls retry helper when development + Manus enabled; maintain idempotent handling and concurrency control.
- **Logging & Notifications**: Workflows emit GitHub summary, optional webhook notifications, and commit JSON snapshots to `logs/progress`; require retention guidance to prevent repo bloat.
- **Testing Expectations**: Maintain unit tests for shared scripts (`scripts/lib/feature-flags.js`, Deno relay tests, Python cost tests) and expand to cover critical GA-driven code paths (Supabase/Sheets script dry-runs, plan selector).

## Non-Functional Requirements
- Security: Secrets via GitHub/OIDC only; sanitize payloads to minimize PHI; ensure verified domain usage in URLs.
- Reliability: Actions must enforce concurrency controls, retries, and idempotency for repeat events; Git commits from workflows must handle push failures gracefully without losing logs.
- Observability: Track webhook success rates, Manus invocation counts, heartbeat signals, cost estimates, and budget usage; log to Supabase or interim storage and expose summaries via Actions outputs.
- Maintainability: Keep code modular (Edge TS, Actions YAML, Python orchestration), include unit tests (signature verification, failure injection) and documentation (Runbook).
- Compliance: Ensure guardrail messaging, hashed identifiers before persistence, audit-ready logs.

## Assumptions & Dependencies
- Google Sheets access via Manus or service account is available with necessary quota.
- Supabase (or equivalent) available for logging; fallback is GitHub artifacts/logs if deferred.
- Verified domain DNS + Edge deployment pipeline exist but details pending.
- Stakeholder KPIs beyond 40% opt-in will be aligned during implementation; design keeps metrics extensible.
- Edge deployment pipeline (Workers/Supabase or equivalent) exists or will be defined alongside implementation.

## Open Questions (Resolved)

すべてのOpen Questionsに対する決定が完了しました。詳細は `.sdd/specs/line-funnel/decisions.md` を参照してください。

### 決定事項サマリー

1. **LINE配信の頻度とセグメント戦略** (D1): デフォルト方針を設定（1日1回、週次3回まで）
2. **Google Sheets台帳の保持期間・アクセス権限・監査ポリシー** (D2): デフォルト方針を設定（アクティブ無期限、アーカイブ6ヶ月）
3. **Manus停止時のフォールバック手順と担当** (D3): ICSテンプレートと手動フォロー手順を確定
4. **Actionsがコミットするlogs/progressのローテーション/アーカイブ方針** (D4): 自動ローテーションスクリプトを実装（90日保持、1年削除）
5. **Cursorvers_LINEsystem/ディレクトリの現行用途** (D5): レガシープロジェクトとして扱い、現在の実装では使用しない

詳細は `.sdd/specs/line-funnel/decisions.md` を参照してください。
