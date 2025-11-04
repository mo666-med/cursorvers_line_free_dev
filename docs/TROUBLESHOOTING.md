# トラブルシューティングガイド

## 外部接続の問題

### GitHub Actionsの権限設定

`.github/workflows/*.yml` に以下の権限を明示的に設定：

```yaml
permissions:
  contents: write
  actions: write
  issues: write
  pull-requests: write
```

### Codexの外部接続設定

`.cursorrules` ファイルを作成：

```markdown
# Codex外部接続許可

Codexは以下の外部APIへの接続を許可されています：
- GitHub API
- Manus API
- LLM API（OpenAI等）
- Supabase API
- LINE API

ネットワーク接続や外部APIへのアクセスは、作業に必要な場合に許可してください。
```

### GitHub Secrets/Variables確認

```bash
# Secrets確認
gh secret list

# Variables確認
gh variable list

# 特定のSecret確認
gh secret list | grep OPENAI_API_KEY
```

## Miyabiエージェントの問題

### ワークフローが実行されない

1. **ラベルが正しく追加されているか確認**
   ```bash
   gh issue view 1 --json labels --jq '.labels[] | .name'
   ```

2. **ワークフローの設定を確認**
   ```bash
   gh workflow view autonomous-agent.yml --yaml
   ```

3. **手動でワークフローを実行**
   ```bash
   gh workflow run autonomous-agent.yml -f issue_number=1
   ```

### APIキーが設定されていない

```bash
# OPENAI_API_KEYを設定
gh secret set OPENAI_API_KEY --body "sk-..."

# LLM_ENDPOINTを設定
gh secret set LLM_ENDPOINT --body "https://api.openai.com/v1/chat/completions"
```

### package.jsonが見つからない

```bash
# package.jsonを作成
npm init -y

# package-lock.jsonを生成
npm install
```

## Manus APIの問題

### MANUS_API_KEYが設定されていない

```bash
# Manus APIキーを設定
gh secret set MANUS_API_KEY --body "your-manus-api-key"

# Manus Base URLを設定
gh variable set MANUS_BASE_URL --body "https://api.manus.im"
```

### Progress Eventが届かない

1. **PROGRESS_WEBHOOK_URLを確認**
   ```bash
   gh secret list | grep PROGRESS_WEBHOOK_URL
   ```

2. **Front Doorが正しく動作しているか確認**
   ```bash
   curl -X POST https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

## Supabaseの問題

### SUPABASE_KEYが設定されていない

```bash
# Supabase APIキーを設定
gh secret set SUPABASE_KEY --body "your-supabase-key"

# Supabase URLを設定
gh variable set SUPABASE_URL --body "https://haaxgwyimoqzzxzdaeep.supabase.co"
```

### Front Doorが動作しない

1. **環境変数を確認**
   ```bash
   supabase secrets list --project-ref haaxgwyimoqzzxzdaeep
   ```

2. **Front Doorを再デプロイ**
   ```bash
   cd functions/relay
   supabase functions deploy relay --project-ref haaxgwyimoqzzxzdaeep
   ```

## 一般的な問題

### ワークフローが失敗する

1. **ログを確認**
   ```bash
   gh run list --workflow="autonomous-agent.yml" --limit 1
   gh run view <run-id> --log
   ```

2. **エラーメッセージを確認**
   - GitHub Actionsのログを確認
   - Issueのコメントを確認

### Issueがpendingから進まない

1. **ラベルを確認**
   ```bash
   gh issue view 1 --json labels --jq '.labels[] | .name'
   ```

2. **ラベルを再追加**
   ```bash
   gh issue edit 1 --remove-label "🤖agent-execute"
   sleep 2
   gh issue edit 1 --add-label "🤖agent-execute"
   ```

3. **手動でワークフローを実行**
   ```bash
   gh workflow run autonomous-agent.yml -f issue_number=1
   ```

## 緊急停止（Kill-Switch）

```bash
# Front Doorの環境変数を設定
supabase secrets set FEATURE_BOT_ENABLED=false --project-ref haaxgwyimoqzzxzdaeep

# または、LINE Developers ConsoleでWebhookをOFF
```

詳細は `RUNBOOK.md` を参照してください。

