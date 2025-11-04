# Repository Structure – Current Snapshot

## Current State (2024-??)
- Active repository with GitHub Actions-heavy automation, Deno edge relay, Supabase/Sheets tooling, and extensive ops docs already committed.
- Top-level directories of note:
  - `.github/workflows/` – >20 workflows covering LINE intake, Manus progress routing, SLO monitoring, budget guardrails, reporting, state machine sync, etc.
  - `functions/relay/` – Deno-based Front Door (`index.ts`) plus KV helper and tests.
  - `scripts/` – Node scripts for Supabase ingest, Google Sheets ledger, Manus API calls, feature flag helpers, plan generation.
  - `orchestration/` – Plan JSONs, cost estimator (`cost.py`), Manus briefs, plan state folders.
  - `docs/` – Large operations knowledge base (runbooks, troubleshooting, KPI notes, Manus integration guides).
  - `Cursorvers_LINEsystem/` – Nested Node/TypeScript project (appears legacy scaffold; confirm ongoing usage).
  - `logs/` – Progress JSON archives produced by workflows.
  - `tests/` – Python cost estimator tests plus Node feature flag unit tests.
- `.sdd/` steering notes now coexist with broader documentation.

## Key Entry Points & Patterns
- Edge relay (`functions/relay/index.ts`) validates LINE/Manus signatures, dedupes events via KV/memory, and dispatches sanitized payloads to GitHub via `repository_dispatch`.
- Primary GitHub Actions entrypoints:
  - `line-event.yml` – Heavily scripted workflow handling plan selection (normal/degraded), Supabase/Sheets persistence, Manus dispatch (dev), logging, notifications, cost estimation.
  - `manus-progress.yml` – Processes Manus push telemetry, updates plan deltas, coordinates follow-up jobs (needs deeper review in requirements phase).
  - `webhook-handler.yml`/`webhook-event-router.yml` – Router for Front Door traffic; confirm interplay with Edge deployment.
- Shared scripts (`scripts/supabase/*`, `scripts/manus-api.js`, `scripts/lib/feature-flags.js`) centralize logic referenced by workflows to keep YAML manageable.
- Plan artifacts stored under `orchestration/plan/` with production/degraded variants and cost governor inputs; workflows expect consistent JSON schema (Plan v1.2, PlanDelta v1.1).

## Known Conventions & Guardrails
- TypeScript for edge runtime (Deno compat) with unit tests in Deno std asserts.
- Node 20 runtime for GitHub Actions scripts; Python 3.11 for cost estimation.
- Hashing of LINE user IDs before persistence, optional message text redaction for compliance.
- Budget enforcement via `orchestration/cost.py`; workflows surface recommendations but still need policy wiring.
- Feature flags driven via GitHub `vars.*` (`MANUS_ENABLED`, `DEGRADED_MODE`, `DEVELOPMENT_MODE`, etc.) with helper utilities and tests.

## Observed Debt / Follow-ups
- Repository contains legacy directories (`Cursorvers_LINEsystem`) and large `node_modules/` folders; need decision on de-duplication or archive.
- Tests limited (cost estimator, feature flags, relay); no integration coverage for Sheets/Supabase scripts or workflow dry-runs.
- Need clarity on deployment pipeline for `functions/relay` (Edge hosting target not documented in repo).
- Secrets/vars expectations scattered across workflows; consolidate into single reference doc.
- Confirm Google Sheets schema alignment with automation (column count mismatch risk noted in script comment).
- Determine policy for logs growth (`logs/progress` committed via Actions could bloat repo).
