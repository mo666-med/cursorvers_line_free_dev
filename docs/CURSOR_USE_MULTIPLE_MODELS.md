# Cursor IDE「Use Multiple Models」が選べない理由

## 🔴 問題: "Use Multiple Models"オプションが選べない

Cursor IDEで「Use Multiple Models」オプションが選択できない場合、以下の原因が考えられます。

## 📋 考えられる原因と解決策

### 1. **Intel Mac vs Apple Silicon（ARM）の違い**

**症状**: Intel Macでは「Use Multiple Models」が利用できない可能性

**確認方法**:
```bash
# CPUアーキテクチャを確認
uname -m
# x86_64 = Intel Mac
# arm64 = Apple Silicon (M1/M2/M3)

# または
arch
# i386 = Intel Mac
# arm64 = Apple Silicon
```

**Intel Macの場合**:
- ❌ 一部の機能が制限されている可能性があります
- ❌ パフォーマンスの問題で機能が無効化されている可能性があります
- ✅ CursorのIntel Mac版では「Use Multiple Models」がサポートされていない可能性があります

**解決策**:
1. **Apple Silicon Macへの移行を検討**
   - Apple Silicon Macでは、より多くの機能が利用可能です
   - パフォーマンスも向上します

2. **環境変数で回避**
   - Intel Macでも、環境変数やGitHub Variablesを使用してモデルを切り替えられます
   - Miyabiチャットの`model`コマンドを使用

3. **Cursorのバージョンを確認**
   - Intel Macでも最新バージョンであれば、機能が利用可能な可能性があります
   - Cursorを最新バージョンに更新してください

### 2. **Cursorのバージョンが古い**

**症状**: 「Use Multiple Models」オプションが表示されない、または無効化されている

**解決策**:
1. Cursorを最新バージョンに更新
   - `Cursor` > `Check for Updates`
   - または公式サイトから最新版をダウンロード: https://cursor.sh

2. バージョン確認方法:
   ```bash
   # Cursor CLIがある場合
   cursor --version
   
   # または、Cursor IDE内で
   # Cursor > About Cursor
   ```

### 3. **プランの制限**

**症状**: Freeプランでは「Use Multiple Models」が利用できない可能性

**解決策**:
1. 現在のプランを確認
   - `Cursor` > `Settings` > `Account` > `Plan`
   - または `Cursor` > `Account Settings`

2. Proプランにアップグレードが必要な場合:
   - Proプランで複数モデル選択が可能になる可能性があります
   - プランの詳細は公式サイトで確認: https://cursor.sh/pricing

### 4. **設定の問題**

**症状**: 設定ファイルに問題がある

**解決策**:
1. Cursorを再起動
   ```bash
   # macOSの場合
   killall Cursor
   # その後、Cursorを再起動
   ```

2. 設定をリセット（必要な場合）
   - `Cursor` > `Settings` > `Preferences` > `Reset Settings`
   - または設定ファイルを手動で削除:
     ```bash
     # macOSの場合
     rm -rf ~/Library/Application\ Support/Cursor/User/settings.json
     ```

### 5. **モデルの設定不足**

**症状**: 使用可能なモデルが正しく設定されていない

**解決策**:
1. モデル設定を確認
   - `Cursor` > `Settings` > `Cursor Settings` > `Models`
   - または `Cmd+,` (macOS) / `Ctrl+,` (Windows/Linux) で設定を開く

2. モデルを有効化
   - 使用したいモデル（GPT-4o、GPT-3.5-turbo、Claude Sonnetなど）にチェックを入れる
   - エージェントモードでモデル選択ドロップダウンを確認

3. APIキーの設定確認
   - `Cursor` > `Settings` > `Cursor Settings` > `API Keys`
   - OpenAI APIキーやAnthropic APIキーが正しく設定されているか確認

### 6. **機能がまだ実装されていない**

**症状**: Cursorのバージョンによっては、この機能がまだ実装されていない可能性

**解決策**:
- Cursorの公式ドキュメントやリリースノートを確認
- 機能が実装されるまで、環境変数やGitHub Variablesを使用した回避策を利用

## 💡 回避策: 環境変数でモデルを切り替える

「Use Multiple Models」が選べない場合でも、以下の方法でモデルを切り替えられます：

### 1. **Miyabiチャットでモデルを切り替え**

```bash
Miyabi > model gpt-4o        # 高品質モードに切り替え
Miyabi > model gpt-3.5-turbo  # コスト重視モードに切り替え
Miyabi > model status         # 現在のモデルを確認
```

### 2. **GitHub Variablesで設定**

```bash
# 高品質モード（開発・本番）
gh variable set OPENAI_MODEL --body "gpt-4o"

# コスト重視モード（テスト・開発初期段階）
gh variable set OPENAI_MODEL --body "gpt-3.5-turbo"
```

### 3. **ローカル.envファイルで設定**

```bash
# .envファイルに設定
OPENAI_MODEL=gpt-4o        # 高品質モード
# OPENAI_MODEL=gpt-3.5-turbo  # コスト重視モード（コメントアウトを切り替え）
```

## 🔍 確認手順

### ステップ1: Cursorのバージョンを確認

```bash
# Cursor CLIがある場合
cursor --version

# または、Cursor IDE内で
# Cursor > About Cursor
```

### ステップ2: 設定を確認

1. `Cursor` > `Settings` > `Cursor Settings` > `Models`
2. 使用可能なモデルが一覧表示されているか確認
3. 必要なモデルにチェックを入れる

### ステップ3: APIキーを確認

1. `Cursor` > `Settings` > `Cursor Settings` > `API Keys`
2. OpenAI APIキーやAnthropic APIキーが設定されているか確認

### ステップ4: エージェントモードで確認

1. エージェントモードでチャットを開く（`Cmd+L` / `Ctrl+L`）
2. モデル選択ドロップダウンを確認
3. 「Use Multiple Models」オプションが表示されるか確認

## 📝 まとめ

**「Use Multiple Models」が選べない主な原因**:
1. ✅ Cursorのバージョンが古い → 最新バージョンに更新
2. ✅ プランの制限 → Proプランにアップグレードを検討
3. ✅ 設定の問題 → Cursorを再起動または設定をリセット
4. ✅ モデルの設定不足 → Modelsセクションでモデルを有効化
5. ✅ 機能がまだ実装されていない → 環境変数で回避

**推奨される対応**:
1. ✅ Cursorを最新バージョンに更新
2. ✅ Settings > Modelsでモデルを有効化
3. ✅ APIキーが正しく設定されているか確認
4. ✅ それでも選べない場合は、環境変数やGitHub Variablesを使用した回避策を利用

**注意**:
- Cursor IDEのUI上での「Use Multiple Models」選択は、Cursorの機能追加を待つ必要がある場合があります
- 現在は環境変数やGitHub Variablesを使用した回避策が推奨されます

