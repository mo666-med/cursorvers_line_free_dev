# 環境変数の設定方法

## 📋 設定が必要な環境変数

1. `MANUS_API_KEY` - Manus APIキー（GitHub Secretsから取得）
2. `MANUS_BASE_URL` - Manus APIのベースURL（固定値: `https://api.manus.im`）
3. `PROGRESS_WEBHOOK_URL` - 進捗Webhook URL（GitHub Secretsから取得）

## 🚀 設定方法

### 方法1: GitHub Secretsから値を取得して.envに設定（推奨）

```bash
# 1. GitHub SecretsからMANUS_API_KEYを取得して.envに設定
MANUS_API_KEY_VALUE=$(gh secret get MANUS_API_KEY 2>/dev/null | grep -v '^Warning:' | head -1)
if [ -n "$MANUS_API_KEY_VALUE" ]; then
  # .envファイルに既に設定されている場合は更新、なければ追加
  if grep -q "^MANUS_API_KEY=" .env 2>/dev/null; then
    sed -i.bak "s|^MANUS_API_KEY=.*|MANUS_API_KEY=$MANUS_API_KEY_VALUE|" .env
  else
    echo "MANUS_API_KEY=$MANUS_API_KEY_VALUE" >> .env
  fi
  echo "✅ MANUS_API_KEYを.envに設定しました"
else
  echo "⚠️  MANUS_API_KEYを取得できませんでした"
fi

# 2. PROGRESS_WEBHOOK_URLを取得して.envに設定
PROGRESS_WEBHOOK_URL_VALUE=$(gh secret get PROGRESS_WEBHOOK_URL 2>/dev/null | grep -v '^Warning:' | head -1)
if [ -n "$PROGRESS_WEBHOOK_URL_VALUE" ]; then
  if grep -q "^PROGRESS_WEBHOOK_URL=" .env 2>/dev/null; then
    sed -i.bak "s|^PROGRESS_WEBHOOK_URL=.*|PROGRESS_WEBHOOK_URL=$PROGRESS_WEBHOOK_URL_VALUE|" .env
  else
    echo "PROGRESS_WEBHOOK_URL=$PROGRESS_WEBHOOK_URL_VALUE" >> .env
  fi
  echo "✅ PROGRESS_WEBHOOK_URLを.envに設定しました"
else
  echo "⚠️  PROGRESS_WEBHOOK_URLを取得できませんでした"
fi

# 3. MANUS_BASE_URLを設定（固定値）
if grep -q "^MANUS_BASE_URL=" .env 2>/dev/null; then
  sed -i.bak "s|^MANUS_BASE_URL=.*|MANUS_BASE_URL=https://api.manus.im|" .env
else
  echo "MANUS_BASE_URL=https://api.manus.im" >> .env
fi
echo "✅ MANUS_BASE_URLを.envに設定しました"
```

### 方法2: 手動で.envファイルを編集

`.env`ファイルを直接編集：

```bash
# .envファイルを開く
# エディタで以下の行を追加または更新

MANUS_API_KEY=your-manus-api-key
MANUS_BASE_URL=https://api.manus.im
PROGRESS_WEBHOOK_URL=https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay
```

**注意**: `MANUS_API_KEY`の実際の値は、GitHub Secretsから取得する必要があります：
```bash
gh secret get MANUS_API_KEY
```

### 方法3: ターミナルでexportコマンドを使用（一時的な設定）

現在のシェルセッションでのみ有効：

```bash
# GitHub Secretsから値を取得してexport
export MANUS_API_KEY=$(gh secret get MANUS_API_KEY 2>/dev/null | grep -v '^Warning:' | head -1)
export MANUS_BASE_URL="https://api.manus.im"
export PROGRESS_WEBHOOK_URL=$(gh secret get PROGRESS_WEBHOOK_URL 2>/dev/null | grep -v '^Warning:' | head -1)
```

**注意**: この方法は新しいターミナルセッションでは無効になります。

## 🔍 設定の確認

### .envファイルの内容を確認

```bash
# 機密情報をマスクして表示
grep -E "MANUS_API_KEY|MANUS_BASE_URL|PROGRESS_WEBHOOK_URL" .env | sed 's/=.*/=***/'
```

### 環境変数が設定されているか確認

```bash
# 環境変数を確認
echo "MANUS_API_KEY: ${MANUS_API_KEY:+設定済み}"
echo "MANUS_BASE_URL: ${MANUS_BASE_URL:-未設定}"
echo "PROGRESS_WEBHOOK_URL: ${PROGRESS_WEBHOOK_URL:+設定済み}"
```

### 実際にManus APIを呼び出してテスト

```bash
# .envファイルを読み込む（sourceコマンドまたはexport）
source .env  # または
export $(grep -v '^#' .env | xargs)

# Manus APIを呼び出してテスト
node scripts/manus-api.js get test-task-id
```

## 📝 実際の値

### MANUS_BASE_URL
- **固定値**: `https://api.manus.im`
- 変更不要

### PROGRESS_WEBHOOK_URL
- **現在の値**: `https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay`
- Supabase Edge FunctionのURL
- GitHub Secretsから取得可能

### MANUS_API_KEY
- **実際の値**: GitHub Secretsに保存されています
- 取得方法: `gh secret get MANUS_API_KEY`
- ローカルで使用する場合は、手動で.envに設定する必要があります

## ⚠️ 注意事項

1. **`.env`ファイルは`.gitignore`に含まれています**
   - 機密情報がGitにコミットされることはありません

2. **GitHub Secretsから値を取得するには認証が必要**
   - `gh auth login` でGitHub CLIにログインする必要があります

3. **環境変数の優先順位**
   - `export`で設定した環境変数 > `.env`ファイル > デフォルト値

4. **新しいターミナルセッション**
   - `.env`ファイルの値は自動的に読み込まれません
   - 必要に応じて`source .env`を実行してください

## ✅ 設定完了後の確認

### 1. 環境変数の読み込み

`.env`ファイルに設定した環境変数を読み込みます：

```bash
# 推奨方法
source .env

# または
export $(grep -v '^#' .env | xargs)
```

### 2. 環境変数の確認

読み込んだ環境変数が正しく設定されているか確認：

```bash
echo "MANUS_API_KEY: ${MANUS_API_KEY:+設定済み}"
echo "MANUS_BASE_URL: ${MANUS_BASE_URL:-未設定}"
echo "PROGRESS_WEBHOOK_URL: ${PROGRESS_WEBHOOK_URL:+設定済み}"
```

### 3. Manus APIのテスト実行

環境変数が正しく設定されていれば、Manus APIを呼び出せます：

```bash
# タスクの作成（テスト）
node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
  orchestration/plan/current_plan.json \
  --webhook "$PROGRESS_WEBHOOK_URL"
```

## 🚀 すぐに使えるスクリプト

以下のスクリプトを実行すると、GitHub Secretsから値を取得して.envに設定します：

```bash
chmod +x scripts/setup-manus-env.sh
./scripts/setup-manus-env.sh
source .env
```

詳細は `scripts/setup-manus-env.sh` を参照してください。
