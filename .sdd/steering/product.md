# Cursorvers LINE Funnel – Steering Notes

## Product Narrative
- Cursorvers delivers medical-AI auditing and consulting services, with content marketing (notably the public note blog) as the primary top-of-funnel.
- Articles direct readers into a LINE channel where ongoing engagements (updates, resources, event invitations) warm leads into paying advisory clients.
- Platform must respect medical safety guardrails: no individual diagnoses, focus on general guidance and clear escalation messaging.

## Goals & Success Signals
- Grow LINE subscriber base from note articles; provisional target conversion rate: 40% of engaged readers opt into LINE.
- Establish repeat touchpoints via automated updates (article drops, resource delivery, event notices) to increase consultation conversions. Detailed KPIs (e.g., service booking rates, churn) still to be defined with stakeholders.
- Maintain lightweight operations to keep maintenance effort low while ensuring audit readiness and safety compliance.

## Stakeholders & Users
- Marketing/content team publishing note articles and orchestrating campaigns.
- Prospective consulting clients (healthcare providers, administrators) consuming content, joining LINE, and evaluating services.
- Internal operations/engagement owners managing messaging cadence, compliance, and hand-offs to consulting delivery.

## User Journeys
1. Reader discovers note article → taps CTA → lands on LINE add-friend prompt → auto-registration flow logs contact in Google Sheets.
2. Registered contact receives automated notifications (new articles, supplementary materials) plus targeted announcements (events, retainer offers).
3. Interested contact escalates to consultation booking or service inquiry via LINE flows routed to operations.

## Pain Points / Risks
- Manual maintenance becomes brittle as operations scale; need automation with minimal human babysitting.
- Compliance risks around handling health-adjacent information and ensuring guardrail messaging is consistently appended.
- Cost governance: Manus usage must stay “last-mile” to avoid point overruns.
- Dependency on third-party platforms (note, LINE, Google services) — require monitoring and graceful degradation paths.

## Open Questions / Assumptions
- Exact KPI baselines for article traffic, conversion funnels, and revenue attribution remain TBD.
- Need clarity on cadence and content types for automated messages (frequency limits, segmentation).
- Governance surrounding Google Sheets access, retention, and auditing still to be set.
- Stakeholder asked for “GitHub Actions-driven requirements definition” but no concrete acceptance criteria shared yet (awaiting clarification).

## Session Notes (2024-??)
- Reconfirmed architecture expectation that funnel automation should stay GitHub Actions-first; no new business metrics provided yet despite follow-up request.
- Still need stakeholder input on broader KPI stack, subscriber segmentation strategy, and operational ownership of content approvals.
- Next steering checkpoint should secure answers to outstanding questions above before advancing to `/sdd-requirements`.

## Session Summary & Next Steps
- Captured product vision (note → LINE → consulting funnel) and provisional conversion target (40% note-to-LINE opt-in).
- Identified automation touchpoints: article alerts, resource delivery, event/consulting promotions, all requiring safety messaging.
- Recognized operational imperatives: lightweight maintainability, cost control on Manus, strong compliance posture.
- Steering inputs (webhook spec, Manus brief v2.0/v3.1, Cursor handover package) already prepared; real-time push notification path recommended for progress telemetry.
- Open items before `/sdd-requirements`: align on detailed KPI stack (beyond 40%), finalize message cadence and segmentation rules, confirm Google Sheets data-handling policy, prioritize automation scenarios for MVP, and schedule implementation readiness tasks (Edge deploy, Actions wiring, secret provisioning) referenced in the handover plan.
