# Cursor IDEのモデル選択制限と回避策

## 🔴 問題: "Use Multiple Models"が選べない

Cursor IDEでは、**"Use Multiple Models"**オプションが選択できない場合があります。

### 考えられる原因

1. **Cursorのバージョンが古い**
   - 最新バージョンでない場合、一部の機能が制限されることがあります
   - **解決策**: Cursorを最新バージョンに更新してください

2. **プランの制限**
   - 使用しているCursorのプラン（Free/Pro）によっては、複数モデルの選択が制限されている可能性があります
   - **解決策**: プランの詳細を確認し、必要に応じてアップグレードを検討してください

3. **設定の問題**
   - 設定ファイルに問題がある場合、機能が無効化されている可能性があります
   - **解決策**: 設定をリセットするか、Cursorを再起動してください

4. **モデルの設定不足**
   - 使用可能なモデルが正しく設定されていない場合、オプションが表示されないことがあります
   - **解決策**: `Cursor` > `Settings` > `Cursor Settings` > `Models`でモデルを有効化してください

## 🔴 問題: AutoとMax Modeしか選べない

Cursor IDEでは、現在**Auto Mode**と**Max Mode**の2つのモードしか選択できない場合があります。

**制限**:
- ❌ 複数のモデル（GPT-4o、GPT-3.5-turbo、Claude Sonnetなど）を選択するトグルがない
- ❌ タスクごとにモデルを切り替える機能がない
- ❌ コスト重視モードと品質重視モードを簡単に切り替えられない

## 💡 回避策

### 1. **環境変数でモデルを切り替える**

プロジェクトレベルでモデルを指定するには、環境変数を使用します。

#### ローカル開発環境

```bash
# .envファイルに設定
OPENAI_MODEL=gpt-4o        # 高品質モード
# OPENAI_MODEL=gpt-3.5-turbo  # コスト重視モード（コメントアウトを切り替え）
```

#### GitHub Actions環境

```bash
# GitHub Variablesで設定
gh variable set OPENAI_MODEL --body "gpt-4o"        # 高品質モード
# gh variable set OPENAI_MODEL --body "gpt-3.5-turbo"  # コスト重視モード
```

### 2. **スクリプトでモデルを切り替える**

Miyabiチャットでモデルを切り替える機能を追加できます。

```bash
# miyabi-chat.shに追加
Miyabi > model gpt-4o        # 高品質モードに切り替え
Miyabi > model gpt-3.5-turbo  # コスト重視モードに切り替え
Miyabi > model status         # 現在のモデルを確認
```

### 3. **プロジェクトごとに設定ファイルを作成**

`.cursorrules`や`.env`ファイルでプロジェクトごとにモデルを設定します。

#### `.cursorrules`での設定例

```markdown
# Cursor Agent設定

## モデル設定
- デフォルト: gpt-4o（高品質）
- コスト重視: gpt-3.5-turbo（環境変数で切り替え可能）

## 使用方法
環境変数`OPENAI_MODEL`でモデルを指定してください。
```

#### `.env`での設定例

```bash
# 高品質モード（推奨）
OPENAI_MODEL=gpt-4o

# コスト重視モード（コメントアウトを切り替え）
# OPENAI_MODEL=gpt-3.5-turbo
```

### 4. **GitHub Variablesで動的に切り替え**

GitHub Variablesを使用して、必要に応じてモデルを切り替えます。

```bash
# 高品質モード（開発・本番）
gh variable set OPENAI_MODEL --body "gpt-4o"

# コスト重視モード（テスト・開発初期段階）
gh variable set OPENAI_MODEL --body "gpt-3.5-turbo"
```

## 🎯 推奨される運用方法

### 開発段階別のモデル選択

| 段階 | モデル | 理由 |
|------|--------|------|
| **初期開発** | `gpt-3.5-turbo` | コスト重視、迅速なプロトタイプ |
| **実装** | `gpt-4o` | 高品質コード生成 |
| **レビュー** | `gpt-4o` | 詳細な品質チェック |
| **本番環境** | `gpt-4o`（確定されたPlan JSON使用） | 高品質、確定済み計画 |

### コスト管理

```bash
# BUDGET.ymlでコスト制限を設定
monthly_budget_usd: 50
thresholds:
  warning: 0.8  # 80% = $40
  emergency: 1.5  # 150% = $75

# コストが高くなりすぎる場合は、gpt-3.5-turboに切り替え
gh variable set OPENAI_MODEL --body "gpt-3.5-turbo"
```

## 🔧 実装例: Miyabiチャットにモデル切り替え機能を追加

`scripts/miyabi-chat.sh`に以下の機能を追加できます：

```bash
# モデル切り替えコマンド
if [[ "$command" =~ ^model\ +(.*)$ ]]; then
  MODEL_NAME=${BASH_REMATCH[1]}
  if [ "$MODEL_NAME" == "status" ]; then
    CURRENT_MODEL=$(gh variable get OPENAI_MODEL --json value -q .value 2>/dev/null || echo "not set")
    echo "Current model: $CURRENT_MODEL"
  else
    echo "Switching to model: $MODEL_NAME"
    gh variable set OPENAI_MODEL --body "$MODEL_NAME"
    echo "✅ Model switched to: $MODEL_NAME"
  fi
  continue
fi
```

使用方法：
```bash
Miyabi > model gpt-4o        # 高品質モードに切り替え
Miyabi > model gpt-3.5-turbo  # コスト重視モードに切り替え
Miyabi > model status         # 現在のモデルを確認
```

## 📊 現在の設定確認方法

### GitHub Variablesの確認

```bash
# 現在のモデル設定を確認
gh variable get OPENAI_MODEL --json value -q .value
```

### ローカル環境変数の確認

```bash
# .envファイルから確認
cat .env | grep OPENAI_MODEL
```

## 🚀 今後の改善案

### 1. **Miyabiチャットにモデル切り替え機能を追加**

`scripts/miyabi-chat.sh`に`model`コマンドを追加して、簡単にモデルを切り替えられるようにします。

### 2. **プロジェクトごとの設定ファイル**

`.cursorrules`や`.env`ファイルでプロジェクトごとにデフォルトモデルを設定します。

### 3. **コスト監視と自動切り替え**

コストが高くなりすぎた場合、自動的に`gpt-3.5-turbo`に切り替える機能を追加します。

## 📝 まとめ

**現状**:
- ❌ Cursor IDEではAuto/Max Modeしか選べない
- ✅ 環境変数やGitHub Variablesでモデルを切り替えることで回避可能

**推奨**:
- ✅ プロジェクトごとに`.env`ファイルでモデルを設定
- ✅ GitHub Variablesで環境ごとにモデルを切り替え
- ✅ Miyabiチャットにモデル切り替え機能を追加（実装可能）

**注意**:
- Cursor IDEのUI上でのモデル選択は、Cursorの機能追加を待つ必要があります
- 現在は環境変数やGitHub Variablesを使用した回避策が推奨されます

