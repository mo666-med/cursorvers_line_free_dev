# VSCodeターミナルでMiyabiチャットを使用する方法

## 🚀 起動方法

### 方法1: npmスクリプトから起動（推奨）

```bash
npm run miyabi
# または
npm run chat
```

### 方法2: 直接スクリプトを実行

```bash
./scripts/miyabi-chat.sh
```

### 方法3: bashコマンドで実行

```bash
bash scripts/miyabi-chat.sh
```

## 📝 使い方

起動後、以下のように自然言語で指示を出せます：

```
Miyabi > Issue #3を処理して
Miyabi > Issue一覧を表示して
Miyabi > help
Miyabi > exit
```

## 🎨 機能

- ✅ カラー表示対応（VSCodeターミナルで見やすく）
- ✅ 自然言語モード（デフォルト）
- ✅ プロジェクトディレクトリに自動移動
- ✅ 環境変数の自動読み込み（.envファイル）

## ⚙️ 環境変数の設定

`.env`ファイルに以下を設定：

```bash
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5
```

## 📋 利用可能なコマンド

- `help` - ヘルプを表示
- `status` - Miyabiステータスを表示
- `issues` - Issue一覧を表示
- `issue <number>` - 特定のIssueを処理
- `exit` / `quit` - チャットを終了
- その他 - 自然言語で指示（例: "Issue #3を処理して"）

