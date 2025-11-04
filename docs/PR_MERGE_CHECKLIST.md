# PRマージチェックリスト

## 📋 PR状況

### Phase1: PR #5
- **タイトル**: "chore: Phase1 T5/T6/T7 test fixtures and act scenarios"
- **ブランチ**: `phase1/core-hardening` → `main`
- **内容**:
  - T5: actシナリオ追加（正常系/縮退系）
  - T6: Manus再試行テストマトリクス統合テスト
  - T7: 経済サーキットブレーカのドリル計画

### Phase2: PR #6
- **タイトル**: "feat: Phase2 T8 - Weekly KPI Report Workflow"
- **ブランチ**: `phase2/t8-kpi-report` → `main`
- **内容**:
  - T8: 週次KPIレポートワークフロー
  - T9: 運用ツール整備（verify-secrets.sh、replayスクリプト）
  - T10: クロスランタイムCI整備（node-tests.yml、verify-secrets.yml）

## ✅ マージ前の確認事項

### 1. PR状態の確認
```bash
# PR #5の状態確認
gh pr view 5 --json title,state,mergeable,url

# PR #6の状態確認
gh pr view 6 --json title,state,mergeable,url
```

### 2. ローカルテストの実行
```bash
# Nodeテスト
npm test

# Denoテスト
deno test --allow-read --allow-env functions/relay/index.test.ts

# Pythonテスト
python -m pytest tests
```

### 3. Secrets検証
```bash
# Secretsと環境変数の確認
./scripts/verify-secrets.sh
```

## 🚀 マージ手順

### ステップ1: PRのレビュー依頼
GitHub上でレビュワーに確認を依頼します。

### ステップ2: マージ実行
レビューが完了し、問題がなければマージします。

```bash
# PR #5をマージ（例）
gh pr merge 5 --squash --delete-branch

# PR #6をマージ（例）
gh pr merge 6 --squash --delete-branch
```

### ステップ3: マージ後の確認

#### 3.1 mainブランチの最新化
```bash
git checkout main
git pull origin main
```

#### 3.2 ローカルテストの再実行
```bash
# Nodeテスト
npm test

# Denoテスト
deno test --allow-read --allow-env functions/relay/index.test.ts

# Pythonテスト
python -m pytest tests
```

#### 3.3 GitHub Actionsの動作確認
以下のワークフローが正常に実行されることを確認：
- `.github/workflows/node-tests.yml`
- `.github/workflows/deno-tests.yml`
- `.github/workflows/python-tests.yml`
- `.github/workflows/verify-secrets.yml`

#### 3.4 環境設定の確認
```bash
# Secrets検証スクリプトの実行
./scripts/verify-secrets.sh
```

## 📝 マージ後の次のステップ

### 1. GitHub Variables/Secretsの設定確認
- `DEVELOPMENT_MODE`
- `MANUS_ENABLED`
- `MANUS_BASE_URL`
- その他必要なSecrets/Variables

### 2. Phase3タスクの準備
- T12: Supabase ↔ Sheets ledger reconciliation
- T13: Security & privacy guardrails
- T14: Stakeholder decision log

### 3. ドキュメントの更新
- `docs/PROGRESS_STATUS.md`の更新
- Runbookの更新（必要に応じて）

## ⚠️ 注意事項

### GitHub CLI認証
PRの確認やマージにはGitHub CLI認証が必要です：

```bash
# GitHub CLI認証
gh auth login

# 認証状態の確認
gh auth status
```

### ブランチ管理
- PR #5: `phase1/core-hardening` → `main`
- PR #6: `phase2/t8-kpi-report` → `main`

マージ後は、必要に応じてブランチを削除できます。


