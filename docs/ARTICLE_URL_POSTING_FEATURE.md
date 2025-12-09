# 記事URL自動投稿機能

## 概要

Cursorvers Botに記事URLを入力すると、AI要約を含むリッチなEmbedメッセージを「📊-トレンド情報共有」チャンネルに自動投稿する機能。

## コマンド仕様

### `/post-article`

**説明**: 記事URLをトレンド情報共有チャンネルに投稿

**パラメータ**:
- `url` (必須): 投稿する記事のURL

**使用例**:
```
/post-article url:https://zenn.dev/example/articles/ai-trends
```

## 処理フロー

1. **コマンド受信**
   - ユーザーが `/post-article url:https://example.com/article` を実行
   - URL形式の簡易バリデーション

2. **即座にレスポンス**
   - 「⏳ 記事を解析中です...」というephemeralメッセージを返す
   - バックグラウンドで処理を継続

3. **記事メタデータ取得**
   - URLにHTTPリクエストを送信
   - OGPタグ（og:title, og:description, og:image）を抽出
   - OGPがない場合は`<title>`タグから取得

4. **AI要約生成**
   - Gemini API (`gemini-2.0-flash-exp`) を使用
   - 記事のタイトルと説明から3〜5文の要約を生成
   - APIが利用できない場合はメタデータのdescriptionを使用

5. **Discord Embed作成**
   - タイトル、要約、URL、サムネイル画像を含むEmbedメッセージを構築
   - 投稿者のDiscord IDをフッターに表示
   - タイムスタンプを付与

6. **Discordチャンネルに投稿**
   - `TREND_CHANNEL_ID` で指定されたチャンネルにEmbedメッセージを投稿
   - Discord API (`POST /channels/{channel_id}/messages`) を使用

7. **Supabaseに記録**
   - `article_posts` テーブルに投稿履歴を保存
   - 成功時: `status = 'posted'`
   - 失敗時: `status = 'failed'`, `error_message` に詳細を記録

## データベーススキーマ

### `article_posts` テーブル

| カラム名 | 型 | 説明 |
|---------|-----|------|
| `id` | UUID | 主キー |
| `article_url` | TEXT | 記事のURL |
| `article_title` | TEXT | 記事のタイトル |
| `article_description` | TEXT | 記事の説明 |
| `article_image_url` | TEXT | OGP画像のURL |
| `summary` | TEXT | AI生成の要約 |
| `discord_message_id` | TEXT | 投稿されたDiscordメッセージのID |
| `discord_channel_id` | TEXT | 投稿先のDiscordチャンネルID |
| `posted_by` | TEXT | 投稿したDiscordユーザーID |
| `status` | TEXT | `pending`, `posted`, `failed` |
| `error_message` | TEXT | エラーメッセージ（失敗時のみ） |
| `created_at` | TIMESTAMP | 作成日時 |
| `updated_at` | TIMESTAMP | 更新日時 |

**インデックス**:
- `idx_article_posts_url`: `article_url` で高速検索
- `idx_article_posts_status`: `status` でフィルタリング
- `idx_article_posts_created_at`: 作成日時の降順ソート

## 環境変数

### 必須

- `DISCORD_BOT_TOKEN`: Discord BotのToken
- `TREND_CHANNEL_ID`: トレンド情報共有チャンネルのID

### オプション

- `GEMINI_API_KEY`: Gemini APIキー（未設定の場合はメタデータのdescriptionを使用）

## エラーハンドリング

### URLが無効な場合

```
⛔ **エラー**: 有効なURLを入力してください。
```

### Discord投稿失敗

- Supabaseに `status = 'failed'` として記録
- エラーメッセージをログに出力

### Gemini API失敗

- フォールバック: メタデータの `description` を使用
- エラーログを出力

## セキュリティ

- **RLS (Row Level Security)**: `article_posts` テーブルは `service_role` のみアクセス可能
- **署名検証**: Discord Interactionの署名を検証（既存機能）
- **環境変数**: API KeysはSupabase Secretsで管理

## 今後の拡張案

- [ ] 重複URL投稿の検出と警告
- [ ] 投稿履歴の閲覧コマンド (`/article-history`)
- [ ] 投稿の編集・削除機能
- [ ] 複数チャンネルへの同時投稿
- [ ] スケジュール投稿機能

## 参考

- Medical AI Article Analyzer: https://medai-anlyz-hc8u3csc.manus.space/
- Discord API Documentation: https://discord.com/developers/docs
- Gemini API Documentation: https://ai.google.dev/gemini-api/docs
