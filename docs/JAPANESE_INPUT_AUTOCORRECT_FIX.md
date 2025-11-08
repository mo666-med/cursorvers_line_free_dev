# 日本語入力自動置換問題の対処方法

## 🔍 問題の症状

- 日本語を入力すると「coinbase」や「bebased」に自動置換される
- すべての日本語が同じ文字列に置き換わる
- 入力メソッドを切り替えても症状が続く

## ✅ 対処方法

### 1. macOSのテキスト置換設定を確認・削除

#### 確認方法

```bash
# テキスト置換設定を確認
defaults read -g NSUserDictionaryReplacementItems
```

#### 削除方法

**方法1: システム設定から削除**

1. **システム設定**を開く（⌘ + Space → 「システム設定」）
2. **キーボード**を選択
3. **テキスト入力**タブを開く
4. **編集...**ボタンをクリック
5. 「置き換え/入力」欄を確認
6. 「coinbase」や「bebased」に関連するエントリを探す
7. 該当する行を選択して「-」ボタンで削除
8. アプリを再起動

**方法2: コマンドラインから削除**

```bash
# すべてのテキスト置換設定を削除（注意: すべて削除されます）
defaults delete -g NSUserDictionaryReplacementItems

# 設定を反映させるため、システム設定を再起動
killall System\ Settings
```

### 2. IME（日本語入力メソッド）のユーザー辞書を確認

#### macOS標準の日本語入力の場合

1. **システム設定** → **キーボード** → **入力ソース**
2. 日本語入力を選択
3. **ユーザー辞書**を開く（⌘ + Space → 「ユーザー辞書」で検索）
4. 「coinbase」や「bebased」を検索
5. 該当するエントリを削除

#### Google日本語入力を使用している場合

1. Google日本語入力の設定を開く
2. **辞書ツール**を開く
3. 「coinbase」や「bebased」を検索
4. 該当するエントリを削除

### 3. エディタ（Cursor/VS Code）のスニペット設定を確認

#### Cursor/VS Codeの場合

1. **設定**を開く（⌘ + ,）
2. **スニペット**を検索
3. 日本語関連のスニペットを確認
4. 「coinbase」や「bebased」に関連するスニペットを削除

#### スニペットファイルを直接確認

```bash
# Cursorのスニペット設定を確認
cat ~/Library/Application\ Support/Cursor/User/snippets/*.json | grep -i coinbase

# VS Codeのスニペット設定を確認
cat ~/Library/Application\ Support/Code/User/snippets/*.json | grep -i coinbase
```

### 4. クリップボード管理アプリやマクロツールを確認

以下のアプリを使用している場合、自動置換設定を確認：

- **Karabiner-Elements**: キーバインド設定を確認
- **BetterTouchTool**: 自動置換設定を確認
- **TextExpander**: 展開ルールを確認
- **Alfred**: スニペット設定を確認

### 5. 拡張機能を無効化して確認

Cursor/VS Codeで拡張機能が原因の可能性があります：

```bash
# Cursorを拡張機能無効で起動（テスト用）
cursor --disable-extensions

# または、VS Codeを拡張機能無効で起動
code --disable-extensions
```

拡張機能無効で症状が消える場合、拡張機能が原因です。

## 🔧 トラブルシューティング手順

### ステップ1: 問題の範囲を特定

1. **ターミナルで日本語入力**を試す
2. **メモ帳で日本語入力**を試す
3. **Cursor/VS Codeで日本語入力**を試す

どのアプリで症状が出るかで原因を絞り込みます：
- **すべてのアプリ**: OS/IMEレベルの設定
- **特定のアプリのみ**: そのアプリの設定

### ステップ2: 入力メソッドを切り替えて確認

1. ⌘ + Space で入力メソッドを切り替え
2. **英語モード**に切り替えて日本語入力
3. **別のIME**（例: Google日本語入力）に切り替えて試す

### ステップ3: 設定をリセット（最終手段）

```bash
# macOSのテキスト置換設定をリセット
defaults delete -g NSUserDictionaryReplacementItems

# IMEのユーザー辞書をリセット（標準の日本語入力の場合）
rm ~/Library/Preferences/com.apple.CharacterPalette.plist
rm ~/Library/Preferences/com.apple.CharacterPicker.plist

# システム設定を再起動
killall System\ Settings
```

## 📝 確認コマンド

```bash
# テキスト置換設定の確認
defaults read -g NSUserDictionaryReplacementItems

# 現在の入力メソッド確認
defaults read ~/Library/Preferences/com.apple.HIToolbox.plist AppleSelectedInputSources

# ロケール設定確認
locale
```

## ⚠️ 注意事項

- 設定を削除する前に、重要な置換設定がないか確認してください
- システム設定を変更する場合は、バックアップを取ることを推奨します
- アプリを再起動しないと設定が反映されない場合があります

## 🔗 関連情報

- [macOS テキスト置換設定](https://support.apple.com/guide/mac-help/use-text-substitutions-on-mac-mchlp2270/mac)
- [日本語入力の設定](https://support.apple.com/guide/mac-help/use-input-sources-on-mac-mchlp1406/mac)

