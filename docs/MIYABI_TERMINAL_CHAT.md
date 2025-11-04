# ターミナルでMiyabiチャットを起動する方法

## 🚀 実行手順

### 1. ターミナルで以下のコマンドを実行

```bash
./scripts/miyabi-chat.sh
```

### 2. `Miyabi >`プロンプトが表示されます

スクリプトを実行すると、以下のように表示されます：

```
🤖 Miyabi CLI Chat Mode
=======================

Type 'help' for available commands
Type 'exit' or 'quit' to exit

Note: This uses Codex Agent (OpenAI-powered) to process issues.

⚠️  OPENAI_API_KEY環境変数が必要です
   設定: export OPENAI_API_KEY="sk-..."

Miyabi > 
```

### 3. コマンドを入力

`Miyabi >`プロンプトが表示されたら、コマンドを入力してください：

```
Miyabi > help
Miyabi > issues
Miyabi > issue 3
Miyabi > exit
```

## ⚠️ 重要

**スクリプトを実行しないと、`Miyabi >`プロンプトは表示されません。**

通常のbashプロンプト（`bash+`など）ではなく、スクリプトを実行してMiyabiチャットモードに入る必要があります。

## 📝 実行例

```bash
# ターミナルで実行
$ ./scripts/miyabi-chat.sh

🤖 Miyabi CLI Chat Mode
=======================

Miyabi > help
Miyabi > issues
Miyabi > issue 3
Miyabi > exit
```

## ✅ 確認方法

- `Miyabi >`プロンプトが表示されれば、正常に動作しています
- コマンドを入力してEnterキーを押すと実行されます
