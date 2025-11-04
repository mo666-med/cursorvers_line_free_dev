# デフォルト設定: 自然言語モード

## ✅ 実装完了

自然言語モードがデフォルト設定になりました。

## 🎯 変更内容

1. **自然言語モードがデフォルト**
   - すべての入力が自然言語として処理されます
   - コマンド形式（`issue 3`など）も引き続き使用可能

2. **ヘルプメッセージの更新**
   - 起動時に自然言語モードがデフォルトであることを表示
   - ヘルプコマンドでも自然言語モードについて説明

3. **エラーメッセージの改善**
   - APIキーが設定されていない場合の説明を追加

## 📝 使い方

### 基本使用

```bash
./scripts/miyabi-chat.sh
```

### 自然言語での指示（デフォルト）

```
Miyabi > Issue #3を処理して
Miyabi > オープンなIssue一覧を見せて
Miyabi > Issue #2を実行して
```

### コマンド形式（引き続き使用可能）

```
Miyabi > issue 3
Miyabi > issues
Miyabi > status
```

## 🔧 設定

`.env`ファイルで設定可能：

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5
```

## ✅ 確認方法

スクリプトを起動すると、以下のように表示されます：

```
🤖 Miyabi CLI Chat Mode
=======================

Type 'help' for available commands
Type 'exit' or 'quit' to exit

💡 Natural Language Mode (Default):
  日本語で自然に指示を入力できます（例: 'Issue #3を処理して'）

Note: This uses Codex Agent (OpenAI-powered) to process issues.

✅ OPENAI_API_KEY: 設定済み

Miyabi > 
```

自然言語モードがデフォルトになり、より直感的に使用できます。

