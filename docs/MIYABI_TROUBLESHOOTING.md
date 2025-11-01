# Miyabi動作しない問題の解決方法

## 問題の原因

1. ❌ `package.json`が存在しない
   - Miyabiのワークフローは`npm ci`と`npm run`コマンドを実行するため、`package.json`が必要

2. ❌ `ANTHROPIC_API_KEY`が設定されていない可能性
   - MiyabiエージェントはClaude APIを使用するため、このシークレットが必要

3. ❌ Miyabiのエージェントスクリプトが存在しない
   - `npm run agents:parallel:exec`が実行できない

## 解決策

### 1. package.jsonを作成 ✅

基本的な`package.json`を作成しました。

### 2. ANTHROPIC_API_KEYを設定

```bash
gh secret set ANTHROPIC_API_KEY --body "your-anthropic-api-key"
```

**取得方法**:
- Anthropic Console: https://console.anthropic.com/
- API Keysセクションから新しいキーを作成

### 3. Miyabiの設定を確認

Miyabiが完全に動作するには、以下のいずれかが必要です：

**オプションA: Miyabiのエージェントスクリプトを実装**
- `src/agents/`ディレクトリにエージェントを実装
- `package.json`にスクリプトを追加

**オプションB: Miyabiのワークフローを簡素化**
- 現在のワークフローを、実際に実装されている機能に合わせて修正

### 4. 現在の設定状況

#### GitHub Secrets
- ✅ `MANUS_API_KEY`
- ✅ `PROGRESS_WEBHOOK_URL`
- ✅ `SUPABASE_KEY`
- ❌ `ANTHROPIC_API_KEY` (未設定)

#### GitHub Variables
- ✅ `SUPABASE_URL`

## 次のステップ

### 1. ANTHROPIC_API_KEYを設定

```bash
gh secret set ANTHROPIC_API_KEY --body "sk-ant-..."
```

### 2. Miyabiの動作確認

```bash
# ワークフローを手動で実行
gh workflow run "Autonomous Agent Execution" -f issue_number=1

# 実行状況を確認
gh run list --workflow="Autonomous Agent Execution"
```

### 3. エラーログの確認

```bash
# 最新の失敗した実行のログを確認
gh run view <run-id> --log
```

## 注意事項

- Miyabiの完全な動作には、Anthropic APIキーが必要です
- `package.json`は作成しましたが、実際のエージェント実装は別途必要です
- 現在のワークフローはMiyabiの標準構成を前提としているため、プロジェクトの実態に合わせて調整が必要かもしれません

