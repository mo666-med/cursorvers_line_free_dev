# GPT-5設定ガイド - 設定場所

## 📍 設定場所の一覧

### 1. GitHub Variables（公開情報）

**場所**: GitHubリポジトリの Settings → Secrets and variables → Actions → Variables

```bash
# コマンドで設定
gh variable set OPENAI_MODEL --body "gpt-5"
```

**確認方法**:
```bash
gh variable list
```

### 2. GitHub Secrets（機密情報）

**場所**: GitHubリポジトリの Settings → Secrets and variables → Actions → Secrets

```bash
# OpenAI APIキーを設定
gh secret set LLM_API_KEY --body "sk-..."

# OpenAI APIエンドポイント（オプション）
gh secret set LLM_ENDPOINT --body "https://api.openai.com/v1/chat/completions"
```

**確認方法**:
```bash
gh secret list
```

## 🎯 必要な設定

### 必須設定

1. **`LLM_API_KEY`** (Secrets)
   - OpenAI APIキー
   - 取得方法: https://platform.openai.com/api-keys

2. **`OPENAI_MODEL`** (Variables) - ✅ 設定済み
   - モデル名: `gpt-5`
   - 現在の値: `gpt-5`

### オプション設定

3. **`LLM_ENDPOINT`** (Secrets)
   - OpenAI APIエンドポイント
   - デフォルト: `https://api.openai.com/v1/chat/completions`
   - カスタムエンドポイントを使用する場合のみ設定

## 📋 設定手順

### ステップ1: OpenAI APIキーを取得

1. https://platform.openai.com/api-keys にアクセス
2. ログイン
3. 「Create new secret key」をクリック
4. APIキーをコピー（`sk-...`で始まる文字列）

### ステップ2: GitHub Secretsに設定

```bash
# OpenAI APIキーを設定
gh secret set LLM_API_KEY --body "sk-あなたのAPIキー"

# エンドポイントを設定（オプション）
gh secret set LLM_ENDPOINT --body "https://api.openai.com/v1/chat/completions"
```

### ステップ3: 設定確認

```bash
# Secretsの確認
gh secret list

# Variablesの確認
gh variable list
```

## 🔍 現在の設定状況

### ✅ 設定済み

- `OPENAI_MODEL`: `gpt-5` (Variables)
- `SUPABASE_URL`: `https://haaxgwyimoqzzxzdaeep.supabase.co` (Variables)
- `MANUS_API_KEY` (Secrets)
- `PROGRESS_WEBHOOK_URL` (Secrets)
- `SUPABASE_KEY` (Secrets)

### ❌ 未設定（要設定）

- `LLM_API_KEY` (Secrets) - OpenAI APIキーが必要

## 🚀 設定後の動作確認

### 1. Issueにラベルを追加

```bash
gh issue edit 1 --add-label "🤖agent-execute"
```

### 2. ワークフローの実行を確認

```bash
# 実行状況を確認
gh run list --workflow="autonomous-agent.yml" --limit 3

# 最新の実行ログを確認
gh run view $(gh run list --workflow="autonomous-agent.yml" --limit 1 --json databaseId --jq '.[0].databaseId') --log
```

## 🌐 GitHub Web UIでの設定方法

### Variablesの設定

1. GitHubリポジトリにアクセス
2. **Settings** → **Secrets and variables** → **Actions**
3. **Variables**タブを選択
4. **New repository variable**をクリック
5. Name: `OPENAI_MODEL`, Value: `gpt-5` を入力
6. **Add variable**をクリック

### Secretsの設定

1. GitHubリポジトリにアクセス
2. **Settings** → **Secrets and variables** → **Actions**
3. **Secrets**タブを選択
4. **New repository secret**をクリック
5. Name: `LLM_API_KEY`, Value: `sk-...`を入力
6. **Add secret**をクリック

## 📝 まとめ

### 設定場所

| 設定項目 | 種類 | 場所 | コマンド |
|---------|------|------|---------|
| `OPENAI_MODEL` | Variables | Settings → Variables | `gh variable set OPENAI_MODEL --body "gpt-5"` |
| `LLM_API_KEY` | Secrets | Settings → Secrets | `gh secret set LLM_API_KEY --body "sk-..."` |
| `LLM_ENDPOINT` | Secrets | Settings → Secrets | `gh secret set LLM_ENDPOINT --body "..."` |

### 現在の状態

- ✅ `OPENAI_MODEL` = `gpt-5` (設定済み)
- ❌ `LLM_API_KEY` = 未設定（**要設定**）

`LLM_API_KEY`を設定すれば、GPT-5でエージェントが動作します！

