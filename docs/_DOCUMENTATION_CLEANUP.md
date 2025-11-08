# ドキュメント整理計画

## 📋 整理方針

### 1. 一時的なファイルのアーカイブ

以下のファイルは一時的な状況記録で、`docs/_archive/`に移動しました：

- ✅ `ISSUE1_EXECUTION_STATUS.md`
- ✅ `GPT5_TEST_STATUS.md`
- ✅ `GPT5_TEST_SUMMARY.md`
- ✅ `MIYABI_ISSUE_RESOLUTION.md`
- ✅ `MIYABI_REVISION_STARTED.md`
- ✅ `MIYABI_REVISION_STATUS.md`
- ✅ `MIYABI_FIX_STATUS.md`
- ✅ `MIYABI_FIX_COMPLETE.md`
- ✅ `MIYABI_ACTIVATION.md`
- ✅ `NEXT_STEPS.md`
- ✅ `NEXT_STEPS_COMPLETE.md`

### 2. 統合計画

#### GPT-5関連の統合

統合先: `SETUP.md` または `GPT5_SETUP.md`

- `GPT5_SETUP_COMPLETE.md` → 統合
- `GPT5_SETUP_LOCATION.md` → 統合
- `OPENAI_API_KEY_SETUP_COMPLETE.md` → 統合
- `GPT5_CODEX_USAGE.md` → 保持（使用方法）
- `GPT5_LIMITS_CONFIRMED.md` → 統合または削除
- `GPT5_MANUS_WORKFLOW.md` → 保持（ワークフロー説明）

#### Manus API関連の統合

統合先: `MANUS_API.md`

- `MANUS_API_INTEGRATION_PLAN.md` → 統合
- `MANUS_API_IMPLEMENTATION.md` → 統合
- `MANUS_API_USAGE.md` → 統合
- `MANUS_API_SECRETS_SETUP.md` → 統合
- `MANUS_API_SETUP_STATUS.md` → 削除（一時的な状況）

#### Supabase関連の統合

統合先: `SETUP.md` または `SUPABASE.md`

- `SUPABASE_SETUP.md` → 統合
- `SUPABASE_KEY_SETUP.md` → 統合

#### Miyabi関連の統合

統合先: `MIYABI.md`

- `MIYABI_GOALS.md` → 統合
- `MIYABI_UNDERSTANDING.md` → 統合
- `MIYABI_MONITORING.md` → 統合
- `MIYABI_CODEX_COMPATIBILITY.md` → 統合
- `MIYABI_TROUBLESHOOTING.md` → 統合
- `MIYABI_NEXT_STEPS.md` → 削除（一時的な手順）

#### セットアップ関連の統合

統合先: `SETUP.md`

- `GITHUB_SECRETS_SETUP.md` → 統合
- `EXTERNAL_CONNECTION_TROUBLESHOOTING.md` → 統合
- `CODEX_AGENT_SETUP.md` → 統合

### 3. 最終的なドキュメント構造

```
docs/
├── README.md（プロジェクト全体の概要）
├── SETUP.md（セットアップ全般）
├── ARCHITECTURE.md（アーキテクチャ）
├── MIYABI.md（Miyabi関連）
├── MANUS_API.md（Manus API関連）
├── GPT5_SETUP.md（GPT-5設定）
├── DEVELOPMENT_PRODUCTION.md（開発段階と本番環境）
├── PRODUCTION_AUTO_RUN.md（本番環境の自動実行）
├── GPT5_MANUS_WORKFLOW.md（GPT-5とManusのワークフロー）
├── TROUBLESHOOTING.md（トラブルシューティング）
├── RUNBOOK.md（運用手順書）
└── _archive/（一時的なファイル）
```

## 🚀 実行計画

1. ✅ 一時的なファイルをアーカイブ
2. ⏳ 統合ドキュメントを作成
3. ⏳ 重複ファイルを削除
4. ⏳ README.mdにドキュメントインデックスを追加

