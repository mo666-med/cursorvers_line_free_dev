# Manus連携スタック原因診断ガイド

## 🔍 スタックの原因候補

Manus連携が実行されない（スタックする）主な原因は以下の通りです。

### 1. GitHub Variablesの未設定/誤設定

**必須変数：**
- `DEVELOPMENT_MODE`: `'true'` である必要がある
- `MANUS_ENABLED`: `'true'` である必要がある
- `MANUS_BASE_URL`: Manus APIのベースURL（例: `https://api.manus.ai`）

**確認方法：**
```bash
# 現在の設定を確認
gh variable list | grep -E "DEVELOPMENT_MODE|MANUS_ENABLED|MANUS_BASE_URL"

# 設定されていない場合は設定
gh variable set DEVELOPMENT_MODE --body "true"
gh variable set MANUS_ENABLED --body "true"
gh variable set MANUS_BASE_URL --body "https://api.manus.ai"
```

### 2. GitHub Secretsの未設定

**必須シークレット：**
- `MANUS_API_KEY`: Manus APIキー
- `PROGRESS_WEBHOOK_URL`: Progress Webhook URL

**確認方法：**
```bash
# シークレットが設定されているか確認（値は表示されない）
gh secret list | grep -E "MANUS_API_KEY|PROGRESS_WEBHOOK_URL"

# 設定されていない場合は設定
gh secret set MANUS_API_KEY --body "your-manus-api-key"
gh secret set PROGRESS_WEBHOOK_URL --body "https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay"
```

### 3. Degradedモードが有効

**条件チェック（`line-event.yml` 166行目）：**
```yaml
if: vars.DEVELOPMENT_MODE == 'true' && vars.MANUS_ENABLED == 'true' && steps.mode.outputs.mode != 'degraded'
```

**Degradedモードになる条件（`line-event.yml` 62-75行目）：**
1. `vars.MANUS_ENABLED` が `'false'`
2. `vars.DEGRADED_MODE` が `'true'`
3. `orchestration/plan/production/degraded.flag` ファイルが存在

**確認方法：**
```bash
# degraded.flagファイルの存在確認
ls -la orchestration/plan/production/degraded.flag

# 存在する場合は削除（必要に応じて）
rm orchestration/plan/production/degraded.flag
```

### 4. 必要なファイルが存在しない

**必須ファイル：**
- `orchestration/plan/current_plan.json`: Plan JSONファイル
- `orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt`: Briefファイル

**確認方法：**
```bash
# ファイルの存在確認
ls -la orchestration/plan/current_plan.json
ls -la orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt

# 存在しない場合は作成が必要
```

### 5. ワークフローの実行条件チェック

**`line-event.yml` の実行条件：**
```yaml
- name: Dispatch to Manus (Development Only)
  if: vars.DEVELOPMENT_MODE == 'true' && vars.MANUS_ENABLED == 'true' && steps.mode.outputs.mode != 'degraded'
```

このステップがスキップされる場合、上記のいずれかの条件が満たされていません。

## 📋 診断チェックリスト

実行前に以下を確認してください：

- [ ] `vars.DEVELOPMENT_MODE == 'true'` が設定されている
- [ ] `vars.MANUS_ENABLED == 'true'` が設定されている
- [ ] `vars.MANUS_BASE_URL` が設定されている
- [ ] `secrets.MANUS_API_KEY` が設定されている
- [ ] `secrets.PROGRESS_WEBHOOK_URL` が設定されている
- [ ] `vars.DEGRADED_MODE` が `'true'` でない（または未設定）
- [ ] `orchestration/plan/production/degraded.flag` ファイルが存在しない
- [ ] `orchestration/plan/current_plan.json` が存在する
- [ ] `orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt` が存在する

## 🔧 トラブルシューティング手順

### ステップ1: 変数とシークレットの確認

```bash
# すべての変数を確認
gh variable list

# すべてのシークレットを確認
gh secret list
```

### ステップ2: ワークフローの実行ログを確認

GitHub Actionsの実行ログで以下を確認：

1. **"Resolve Plan Mode"ステップ**の出力：
   - `mode=normal` になっているか
   - `mode=degraded` の場合は原因を確認

2. **"Dispatch to Manus"ステップ**が実行されているか：
   - スキップされている場合は条件が満たされていない
   - 実行されている場合はエラーメッセージを確認

### ステップ3: 手動実行でテスト

```bash
# ワークフローを手動実行
gh workflow run line-event.yml \
  --ref main \
  -f development_mode=true
```

### ステップ4: ログで詳細確認

GitHub Actionsの実行ログで以下を確認：
- `🚀 Calling Manus API to create task...` が表示されているか
- エラーメッセージの内容
- `MANUS_API_KEY is not set` などの警告

## 🎯 よくある原因と解決策

### 原因1: `MANUS_ENABLED` が `'false'`
**解決策：**
```bash
gh variable set MANUS_ENABLED --body "true"
```

### 原因2: `degraded.flag` ファイルが存在
**解決策：**
```bash
rm orchestration/plan/production/degraded.flag
git commit -m "Remove degraded.flag to enable Manus"
git push
```

### 原因3: `MANUS_API_KEY` が未設定
**解決策：**
```bash
gh secret set MANUS_API_KEY --body "your-manus-api-key"
```

### 原因4: `DEVELOPMENT_MODE` が `'false'`
**解決策：**
```bash
gh variable set DEVELOPMENT_MODE --body "true"
```

## 📝 関連ファイル

- `.github/workflows/line-event.yml`: メインワークフロー
- `orchestration/plan/current_plan.json`: Plan JSONファイル
- `orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt`: Briefファイル
- `scripts/manus-api.js`: Manus API呼び出しスクリプト

