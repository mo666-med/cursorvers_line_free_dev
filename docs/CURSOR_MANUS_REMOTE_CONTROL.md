# Cursor IDEからManus APIを使った遠隔操作

## ✅ 可能です！

Cursor IDEからManus APIを使ってManusを遠隔操作することは**完全に可能**です。

## 📋 実装済み機能

### 1. Manus API CLIツール

- **`scripts/manus-api.js`**: コマンドラインからManus APIを呼び出すツール
- **`scripts/lib/manus-api.js`**: Manus API呼び出し用のライブラリ

### 2. サポートされている操作

- ✅ **タスク作成**: Plan JSONをManusに送信して実行
- ✅ **タスク情報取得**: 実行中のタスクの状態を確認
- ✅ **進捗Webhook**: 実行進捗をGitHub Actionsに通知

## 🚀 使用方法

### 方法1: Cursorのターミナルから直接実行

```bash
# 1. 環境変数を設定
export MANUS_API_KEY="your-manus-api-key"
export MANUS_BASE_URL="https://api.manus.im"
export PROGRESS_WEBHOOK_URL="https://your-domain.com/functions/v1/relay"

# 2. タスクを作成（Manusに実行指示）
node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
  orchestration/plan/current_plan.json \
  --webhook "$PROGRESS_WEBHOOK_URL"

# 3. タスクの状態を確認
node scripts/manus-api.js get <task-id>
```

### 方法2: CursorのMCP（Model Context Protocol）を使用

CursorのMCP機能を使用すると、Cursorのチャット画面から直接Manus APIを呼び出せます。

#### セットアップ手順

1. **MCP設定ファイルを作成**

`.cursor/mcp.json` を作成：

```json
{
  "mcpServers": {
    "manus-api": {
      "command": "node",
      "args": [
        "scripts/manus-api.js"
      ],
      "env": {
        "MANUS_API_KEY": "${env:MANUS_API_KEY}",
        "MANUS_BASE_URL": "${env:MANUS_BASE_URL}",
        "PROGRESS_WEBHOOK_URL": "${env:PROGRESS_WEBHOOK_URL}"
      }
    }
  }
}
```

2. **環境変数を設定**

`.env` ファイルまたはシステム環境変数に設定：

```bash
MANUS_API_KEY=your-manus-api-key
MANUS_BASE_URL=https://api.manus.im
PROGRESS_WEBHOOK_URL=https://your-domain.com/functions/v1/relay
```

3. **CursorでMCPツールを有効化**

- Cursorのチャット画面で `Available Tools` から `manus-api` を有効化
- または `@manus-api` と入力してツールを選択

4. **Manus APIを呼び出す**

```
Cursor Chat: @manus-api create orchestration/MANUS_EXECUTION_BRIEF_costaware.txt orchestration/plan/current_plan.json --webhook https://your-domain.com/functions/v1/relay
```

### 方法3: GitHub Actionsから実行（既に実装済み）

`.github/workflows/line-event.yml` で既に実装されています：

```yaml
- name: Dispatch to Manus (Development Only)
  if: vars.DEVELOPMENT_MODE == 'true' && vars.MANUS_ENABLED == 'true'
  env:
    MANUS_API_KEY: ${{ secrets.MANUS_API_KEY }}
    MANUS_BASE_URL: ${{ vars.MANUS_BASE_URL }}
    PROGRESS_WEBHOOK_URL: ${{ secrets.PROGRESS_WEBHOOK_URL }}
 run: |
    node scripts/manus-api.js create \
      orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
      orchestration/plan/current_plan.json \
      --webhook "$PROGRESS_WEBHOOK_URL"
```

## 📝 使用例

### 例1: ローカル環境からタスクを作成

```bash
# 環境変数を設定
export MANUS_API_KEY="sk-..."
export MANUS_BASE_URL="https://api.manus.im"
export PROGRESS_WEBHOOK_URL="https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay"

# Plan JSONをManusに送信
node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
  orchestration/plan/current_plan.json \
  --webhook "$PROGRESS_WEBHOOK_URL"
```

### 例2: タスクの状態を確認

```bash
# 環境変数を設定
export MANUS_API_KEY="sk-..."

# タスクIDを指定して状態を取得
node scripts/manus-api.js get task-123
```

### 例3: Cursorのチャットから実行

1. Cursorのチャット画面を開く（`Cmd+L` / `Ctrl+L`）
2. 以下を入力：

```
@manus-api create orchestration/MANUS_EXECUTION_BRIEF_costaware.txt orchestration/plan/current_plan.json --webhook https://your-domain.com/functions/v1/relay
```

## 🔧 必要な設定

### 1. 環境変数の設定

```bash
# ローカル環境
export MANUS_API_KEY="your-manus-api-key"
export MANUS_BASE_URL="https://api.manus.im"
export PROGRESS_WEBHOOK_URL="https://your-domain.com/functions/v1/relay"

# または .env ファイルに設定
echo "MANUS_API_KEY=your-manus-api-key" >> .env
echo "MANUS_BASE_URL=https://api.manus.im" >> .env
echo "PROGRESS_WEBHOOK_URL=https://your-domain.com/functions/v1/relay" >> .env
```

### 2. GitHub Secrets/Variables（GitHub Actionsから使用する場合）

```bash
# GitHub Secrets
gh secret set MANUS_API_KEY --body "your-manus-api-key"
gh secret set PROGRESS_WEBHOOK_URL --body "https://your-domain.com/functions/v1/relay"

# GitHub Variables
gh variable set MANUS_BASE_URL --body "https://api.manus.im"
```

## 📊 実行フロー

```
Cursor IDE
  ↓
1. ターミナルまたはMCPから実行
  ↓
2. scripts/manus-api.js が呼び出される
  ↓
3. Manus APIにHTTPリクエスト送信
  POST https://api.manus.im/v1/tasks
  ↓
4. Manusがタスクを実行
  ↓
5. Progress EventがWebhook URLに送信
  ↓
6. GitHub Actionsが進捗を処理
```

## 🎯 実用例

### 開発中のテスト

```bash
# Cursorのターミナルで実行
node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
  orchestration/plan/current_plan.json
```

### 本番環境での実行

GitHub Actions経由で自動実行されます：

1. LINE Eventを受信
2. Plan JSONを生成または読み込み
3. Manus APIを呼び出してタスクを作成
4. Manusが実行して結果をWebhookで通知

## ⚠️ Codexの説明と実際の制限

### Codexの説明（要約）

Codex（CursorのAIアシスタント）は以下の制限があると説明されています：

1. **GitHub Secretsの直接読み取り**: ❌ できない
   - `${{ secrets.MANUS_API_KEY }}` のような値は直接読み取れない
   - GitHub Actionsの環境でのみ利用可能

2. **ネットワークへの直接アクセス**: ❌ できない（Codexの説明では）
   - ただし、実際には一部のツール（web_searchなど）は使用可能

3. **GitHub Actions経由なら可能**: ✅
   - GitHub Actions上で実行すれば、Secretsを参照してManus APIを呼び出せる

### 実際の環境（このAIアシスタント）での制限

1. **GitHub Secretsの直接読み取り**: ❌ できない
   - ただし、環境変数として設定されていれば読み取り可能

2. **ネットワークアクセス**: ✅ 可能（web_searchツールなど）

3. **ローカルファイル操作**: ✅ 可能

4. **ターミナルコマンド実行**: ✅ 可能

5. **環境変数の読み取り**: ✅ 可能（.envファイルやexportされた環境変数）

### 実際にManus APIを呼び出すには

**条件**: `MANUS_API_KEY`が環境変数として設定されている必要があります。

```bash
# 環境変数を設定
export MANUS_API_KEY="your-manus-api-key"
export MANUS_BASE_URL="https://api.manus.im"
export PROGRESS_WEBHOOK_URL="https://your-domain.com/functions/v1/relay"

# その後、Manus APIを呼び出し可能
node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
  orchestration/plan/current_plan.json
```

### 推奨される方法

1. **GitHub Actions経由（推奨）**
   - `manus-task-runner.yml` を使用
   - GitHub Secretsを自動的に参照
   - 最も安全で確実な方法

2. **ローカル環境変数設定**
   - `.env`ファイルに設定
   - または`export`で環境変数を設定
   - その後、ターミナルから直接実行可能

3. **GitHub CLI経由**
   - `gh workflow run`コマンドでGitHub Actionsを手動起動
   - Secretsを自動的に参照

## 📚 参考資料

- `scripts/manus-api.js`: CLIツールの実装
- `scripts/lib/manus-api.js`: APIクライアントライブラリ
- `docs/MANUS_API.md`: Manus API連動ガイド
- `orchestration/MANUS_EXECUTION_BRIEF_costaware.txt`: Manus実行指示書
- `orchestration/plan/current_plan.json`: Plan JSONの例

## 🔍 トラブルシューティング

### MANUS_API_KEYが設定されていない

```bash
# エラー: MANUS_API_KEY environment variable is required

# 解決方法:
export MANUS_API_KEY="your-manus-api-key"
```

### Manus APIへの接続エラー

```bash
# エラー: Manus API error: 401 Unauthorized

# 解決方法:
# 1. APIキーが正しいか確認
# 2. MANUS_BASE_URLが正しいか確認（https://api.manus.im）
```

### Plan JSONが見つからない

```bash
# エラー: Plan file not found

# 解決方法:
# 1. orchestration/plan/current_plan.json が存在するか確認
# 2. ファイルパスが正しいか確認
```

## ✅ まとめ

**Cursor IDEからManus APIを使ってManusを遠隔操作することは完全に可能です。**

- ✅ ターミナルから直接実行可能
- ✅ MCPを使用してCursorのチャットから実行可能
- ✅ GitHub Actionsから自動実行可能（既に実装済み）
- ✅ 進捗通知をWebhookで受信可能

詳細は `docs/MANUS_API.md` を参照してください。
