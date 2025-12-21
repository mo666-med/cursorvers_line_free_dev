# LINE Official Account 設定

LINE Official Account Manager の設定をバージョン管理するためのディレクトリです。

## ファイル一覧

| ファイル | 説明 |
|---------|------|
| `welcome-message.json` | あいさつメッセージ設定 |

## ウェルカムメッセージ

### 現在のメッセージ vs 改善版

`welcome-message.json` には2つのバージョンが含まれています：

| キー | 説明 |
|-----|------|
| `current` | LINE Manager に設定されている現在のメッセージ |
| `improved` | 改善版（より高いコンバージョン率を目指す） |

### 改善版の特徴

- 感謝から始めて好印象を与える
- 「今すぐ使える」で即効性を強調
- 罫線で視認性向上
- 特典内容を具体化
- 緊急性を追加（予告なく終了）
- CTAを明確に

### LINE Manager への反映手順

1. [LINE Official Account Manager](https://manager.line.biz/account/@529ybhfo/autoresponse/welcome) にログイン
2. 応答設定 > あいさつメッセージ を開く
3. `welcome-message.json` の `improved.text` の内容をコピー
4. プレビューで確認後「変更を保存」

## 設定の自動取得（Manus API）

`scripts/fetch-line-settings.js` を使用して Manus API 経由で設定を取得できます。

### 使用方法

```bash
# ウェルカムメッセージ設定を取得
MANUS_API_KEY=xxx node scripts/fetch-line-settings.js welcome-message

# リッチメニュー設定を取得
MANUS_API_KEY=xxx node scripts/fetch-line-settings.js rich-menu

# 自動応答設定を取得
MANUS_API_KEY=xxx node scripts/fetch-line-settings.js auto-response
```

### 対応する設定タイプ

| タイプ | 説明 | LINE Manager URL |
|-------|------|-----------------|
| `welcome-message` | あいさつメッセージ | `/autoresponse/welcome` |
| `rich-menu` | リッチメニュー | `/richmenu` |
| `auto-response` | 自動応答 | `/autoresponse` |

## 環境変数

| 変数名 | 説明 | デフォルト値 |
|-------|------|-------------|
| `MANUS_API_KEY` | Manus API キー | (必須) |
| `MANUS_BASE_URL` | Manus API URL | `https://api.manus.ai` |
| `LINE_ACCOUNT_ID` | LINE アカウントID | `@529ybhfo` |

## 変更履歴

| 日付 | 変更内容 |
|-----|---------|
| 2025-12-21 | 初版作成、改善版メッセージ追加 |
