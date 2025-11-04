# Traceability – Cursorvers LINE Funnel

## Acceptance Criteria ↔ Tasks

| Acceptance Criteria (.sdd/specs/archives/2025-11-01-line-funnel/requirements.md) | Status | Linked Tasks |
|---|---|---|
| LINE Webhook 処理（Front Doorで署名検証・ハッシュ化・dispatch） | ✅ 完了 | T3 |
| Manus Progress 取り込み（Bearer検証・ProgressEvent v1.1） | 未完 | T6, T11 |
| Plan JSON 運用（開発モードでPlanDelta生成、本番で固定Plan実行） | ✅ 完了 | T4 |
| PlanDelta 処理（retry/amended時のManus再呼び出し・後続起動） | 未完 | T6, T11 |
| Conversion Tracking（Supabase/Sheets記録 + 週次KPIレポート） | 未完 | T5, T8, T12 |
| 予算ガードレール（80%警告・150%でManus停止+代替ルート） | 未完 | T7, T4 |
| 監査ログ（logs/progress保存と監査可能性） | 未完 | T5, T6, T11 |
| テレメトリと通知（主要WF完了通知とRunbook連携） | 未完 | T8, T9, T11 |

## Feature Flag Matrix

| Flag | Source | Default (Dev) | Default (Prod) | Effect | Validation Coverage |
|---|---|---|---|---|---|
| `vars.DEVELOPMENT_MODE` | GitHub Variables | `true` | `false` | トグルでPlanDelta生成・Manusへのdispatch可否を切替 | `tests/node/feature-flags.test.mjs` (`npm run test:feature-flags`) |
| `vars.MANUS_ENABLED` | GitHub Variables | `true` | `false` | `false`でManus経路を常に無効化、Planモードを`degraded`へ | `tests/node/feature-flags.test.mjs` (`npm run test:feature-flags`) |
| `vars.MANUS_BASE_URL` | GitHub Variables | `https://api.manus.ai` | `https://api.manus.ai` | Manus API呼び出しのベースURL | `tests/node/feature-flags.test.mjs` (`npm run test:feature-flags`) |
| `vars.DEGRADED_MODE` | GitHub Variables | `false` | `false` | `true`で強制的にデグレードモード（ICSルート） | `tests/node/feature-flags.test.mjs` (`npm run test:feature-flags`) |
| `FEATURE_BOT_ENABLED` | Supabase Edge / Actions secrets | `true` | `true` | `false`でEdge Relayが即座にイベント処理を拒否 | `functions/relay/index.test.ts` |
| `DEVELOPMENT_MODE` (environment) | Local `.env` / CLI | `true` | `false` | CLI/スクリプト実行時のPlanDelta挙動に影響 | `tests/node/feature-flags.test.mjs` (`npm run test:feature-flags`) |

## Traceability Notes

- 既完了タスク（T3, T4）は該当受入条件を満たしており、残タスクは上表の通り未完ステータスとして管理する。
- フラグ値の最終責任者は `/docs/ENV_VAR_SETUP.md` に記載。GitHub Variables と Supabase secrets の組み合わせで本番と開発の切替を行う。
- 本トレーサビリティ表は `/sdd-implement` 実行前に更新すること。
- 2025-11-04 時点で `./dev-infra/dev.sh check` が合格し、`plan-diff --summary` で Plan 同期、`dispatch manus_progress` による GitHub Actions 起動テストも完了。Secrets/Vars 同期（MANUS_API_KEY / PROGRESS_WEBHOOK_URL / MANUS_BASE_URL）も反映済み。
