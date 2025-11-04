# Technical Steering – Cursorvers LINE Funnel

## Architecture & Runtime
- Execution split per existing guidance:
  - Front Door on Edge/Workers receives webhooks (LINE, Manus), performs signature verification, minimal payload sanitization, dispatches GitHub repository_dispatch.
  - GitHub Actions orchestrate planning, automation, safety checks, and ongoing operations (Cost Governor, monitoring, backups).
  - Manus reserved for narrow “last mile” external integrations when automation cannot stay within Actions/Edge (e.g., targeted Gmail or Calendar actions).
  - Cursor IDE (Codex) drives specification, implementation, testing, PR lifecycle.
- LINE registration data to be written to Google Sheets; need connector (likely Manus or direct API via Actions) while avoiding PHI leakage.
- Current repo implements the pattern: `functions/relay/index.ts` (Deno) feeds `line-event.yml` / `manus-progress.yml` workflows; Node/Python scripts called inside workflows handle Supabase upserts, Sheets sync, and Manus task creation.
- Feature flags and degraded mode logic centralized in `scripts/lib/feature-flags.js` with associated unit tests, supporting toggles via GitHub `vars.*`.

## Technology Stack Targets
- Node.js 18+ (or Deno/Miniflare) for Edge/Workers functions, TypeScript preferred for clarity and linting.
- Python 3.11 for orchestration helpers (cost estimation, validation scripts) and potential data tooling.
- GitHub Actions with required concurrency limits per task_id, lint/unit/schema gates, and safety guardrail enforcement.
- Storage currently Google Sheets; future database migration plan TBD.
- Supabase REST API leveraged directly from workflow scripts (`scripts/supabase/upsert-line-event.js`) with hashed user IDs; dedupe built via deterministic SHA-256 keys.
- Google Sheets ledger updated through service-account JWT flow in `scripts/sheets/upsert-line-member.js`; expects header synchronization (`A:E` range).
- Operational convention: when stakeholders request Manus/Supabase actions, attempt available execution paths (GitHub Actions, MCP, or CLI via scripts) before concluding非対応—document blockers only after trying feasible routes.

## Security & Compliance Constraints
- Secrets managed exclusively via GitHub Secrets/Environments with OIDC; no .env files committed.
- All outbound user messaging must append the medical safety disclaimer consistently (shareable helper).
- Payload minimization: hash or redact user identifiers where feasible before persistence.
- Verified domain usage enforced for public URLs; placeholders should default to `{{VERIFIED_DOMAIN}}`.

## Deployment & Ops
- Front Door deployments via Edge/Workers pipeline (process unspecified; TODO capture exact deployment scripts).
- GitHub Actions triggered via repository_dispatch, schedule, or PR events; ensure concurrency, retries, and failure injection tests.
- Monitoring to include HTTP success rates, latency, Manus invocation counts, and heartbeat tracking per prior Cost Governor design.
- Webhook and Manus execution brief (v3.1 cost-aware) designs completed; push-style progress notifications to GitHub (ProgressEvent v1.1) recommended for real-time telemetry.
- Cursor handover package prepared (zip of 13 files including `.cursorrules`, Edge relay stub, Actions workflows, cost estimator, runbook, plan JSON) awaiting upload to GitHub repo `mo666-med/line-friend-registration-system`.
- Need to document actual deployment path for Edge function (Workers/Supabase) since repository currently stores Deno code without deployment scripts.

## Known Gaps / TODO
- Need detailed plan for Google Sheets integration (auth method, rate limits, failure handling).
- No current test or lint setup in repo; bootstrapping tasks required.
- Health check strategy for Front Door endpoints unspecified.
- Disaster recovery and rollback automation (beyond runbook outline) to be defined.
- Confirm secret provisioning flow for GitHub Actions/Edge, including Progress webhook URL and Manus credentials.
- Determine lifecycle policy for workflow-generated Git commits (`logs/progress`) to avoid repository bloat.
- Clarify ownership and maintenance expectations for legacy `Cursorvers_LINEsystem/` subproject and duplicated `node_modules/`.
