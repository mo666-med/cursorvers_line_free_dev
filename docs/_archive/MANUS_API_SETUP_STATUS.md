# Manus API設定状況と次のステップ

## ✅ 設定完了

- ✅ `MANUS_API_KEY` - GitHub Secretsに設定済み

## ⚠️ 追加で必要な設定

### 1. GitHub Secrets（必須）

```bash
# 進捗Webhook URL（Manusから進捗を受け取るURL）
gh secret set PROGRESS_WEBHOOK_URL --body "https://your-domain.jp/functions/relay"
```

**重要**: このURLは、Manusが進捗イベントを送信する先のWebhook URLです。
- Supabase Edge FunctionのURL（例: `https://<project-ref>.supabase.co/functions/v1/relay`）
- または、その他のWebhookエンドポイント

### 2. GitHub Variables（推奨）

```bash
# Manus APIのベースURL（公開情報）
gh variable set MANUS_BASE_URL --body "https://api.manus.im"

# Verified Domain（公開情報）
gh variable set VERIFIED_DOMAIN --body "https://your-verified-domain.jp"
```

## 現在の設定状況

- ✅ `MANUS_API_KEY` - 設定済み
- ❌ `PROGRESS_WEBHOOK_URL` - 未設定（必須）
- ❌ `MANUS_BASE_URL` - 未設定（推奨）
- ❌ `VERIFIED_DOMAIN` - 未設定（推奨）

## 次のステップ

### 1. PROGRESS_WEBHOOK_URLを設定

このURLは、ManusがProgress Eventを送信する先です。現在のプロジェクトでは：

```
https://<your-supabase-project-ref>.supabase.co/functions/v1/relay
```

Supabaseのプロジェクト参照IDが必要です。

### 2. 設定の確認

```bash
# Secretsの確認
gh secret list

# Variablesの確認
gh variable list
```

### 3. 動作確認

設定が完了したら、ワークフローをテスト実行できます：

```bash
# ワークフローを手動で実行
gh workflow run line-event.yml

# 実行状況を確認
gh run list --workflow=line-event.yml
```

## 参考

- `docs/MANUS_API_SECRETS_SETUP.md`: 詳細な設定手順
- `functions/relay/index.ts`: Front Doorの実装（Webhook受信先）

