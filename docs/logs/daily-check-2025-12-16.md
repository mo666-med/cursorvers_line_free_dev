# Cursorvers 日次システム点検レポート

**日時:** 2025-12-16 06:08:16 JST

---

## 📊 点検結果サマリー

| サービス | 状態 | 詳細 |
|---------|------|------|
| LINE Bot | ✅ OK | 正常稼働中 |
| Discord Webhook | ⚠️ SKIP | Webhook URL未設定 |
| Supabase Edge Functions | ⚠️ LIMITED | 認証エラーによりログ取得不可 |
| n8n Workflow | ❌ NG | API認証エラー（unauthorized） |
| Google Sheets | ⚠️ SKIP | n8n経由のため確認不可 |
| GitHub (free_dev) | ✅ OK | 最新コミット確認済み |
| GitHub (paid_dev) | ❌ NG | リポジトリが存在しない（404） |

---

## 🔍 詳細点検結果

### 1. LINE Bot (Supabase Edge Functions)

**エンドポイント:** `https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/line-webhook`

**GET テスト結果:**
```
OK - line-webhook is running
HTTP Status: 200
```

**評価:** ✅ 正常稼働中

LINE Bot Edge Functionは正常に応答しています。GETリクエストに対して期待通りのレスポンスを返しており、エンドポイントは稼働しています。

---

### 2. Discord Webhook

**状態:** ⚠️ SKIP

**理由:** Discord Webhook URLが未設定または不正な形式です。提供されたのは招待リンク（`https://discord.gg/AnqkRuS5`）であり、Webhook URL（`https://discord.com/api/webhooks/...`）ではありません。

**推奨対応:** Discord サーバーの設定から正しいWebhook URLを取得してください。

---

### 3. Supabase Edge Functions

**プロジェクトID:** `haaxgwyimoqzzxzdaeep`

**ログ取得試行結果:**
```
Error: Unauthorized. Please provide a valid access token to the MCP server via the --access-token flag or SUPABASE_ACCESS_TOKEN.
```

**評価:** ⚠️ LIMITED

Edge Function自体は稼働していますが、Supabase Management APIへのアクセスに必要な認証情報が不足しているため、詳細なログ確認ができません。

**推奨対応:** Supabaseアクセストークンを環境変数 `SUPABASE_ACCESS_TOKEN` に設定してください。

---

### 4. n8n Workflow

**インスタンスURL:** `https://n8n.srv995974.hstgr.cloud`

**API接続試行結果:**
```json
{
  "message": "unauthorized"
}
```

**評価:** ❌ NG

n8n APIへの接続が認証エラーで失敗しています。提供されたAPI Keyが無効または期限切れの可能性があります。

**推奨対応:**
1. n8nダッシュボードで新しいAPI Keyを生成
2. 環境変数 `N8N_API_KEY` を更新
3. n8nインスタンスのAPI設定を確認

---

### 5. Google Sheets

**状態:** ⚠️ SKIP

**理由:** Google Sheetsの同期状況確認はn8nワークフロー経由で行う予定でしたが、n8n APIへのアクセスができないため確認できませんでした。

---

### 6. GitHub リポジトリ

#### cursorvers_line_free_dev

**リポジトリ:** `mo666-med/cursorvers_line_free_dev`

**最新コミット情報:**
- **SHA:** `01e12d04eeac04c0eb3b122cfba70f49a9edcc77`
- **メッセージ:** `docs: Add daily system check log with data integrity check (2025-12-15)`
- **作成者:** `Manus Automation`
- **日時:** `2025-12-15T19:14:54Z`

**評価:** ✅ OK

リポジトリは正常にアクセス可能で、最新のコミットが確認できました。

#### cursorvers_line_paid_dev

**リポジトリ:** `mo666-med/cursorvers_line_paid_dev`

**アクセス試行結果:**
```json
{
  "message": "Not Found",
  "status": "404"
}
```

**評価:** ❌ NG

リポジトリが存在しないか、アクセス権限がありません。

**推奨対応:**
1. リポジトリ名のスペルミスを確認
2. リポジトリが削除されていないか確認
3. GitHubアカウントのアクセス権限を確認
4. プライベートリポジトリの場合、認証トークンのスコープを確認

---

## 🔧 自動修繕実行結果

今回の点検では、以下の理由により自動修繕は実行されませんでした：

1. **LINE Bot:** 正常稼働中のため修繕不要
2. **n8n API認証エラー:** API Keyの再生成が必要（手動対応が必要）
3. **Supabase認証エラー:** アクセストークンの設定が必要（手動対応が必要）
4. **GitHub paid_dev リポジトリ:** リポジトリの存在確認が必要（手動対応が必要）

---

## 📋 推奨アクション

### 優先度：高

1. **n8n API Key の更新**
   - n8nダッシュボードで新しいAPI Keyを生成
   - 環境変数を更新して再テスト

2. **GitHub paid_dev リポジトリの確認**
   - リポジトリの存在確認
   - 必要に応じて新規作成またはアクセス権限の付与

### 優先度：中

3. **Supabase Access Token の設定**
   - Supabaseダッシュボードでアクセストークンを生成
   - 環境変数 `SUPABASE_ACCESS_TOKEN` に設定

4. **Discord Webhook URL の設定**
   - Discordサーバー設定から正しいWebhook URLを取得
   - 自動報告機能の有効化

---

## 📈 システム健全性スコア

**総合スコア: 50/100**

- LINE Bot: 20/20 ✅
- Discord Webhook: 0/15 ⚠️
- Supabase: 10/20 ⚠️
- n8n: 0/20 ❌
- Google Sheets: 0/10 ⚠️
- GitHub (free_dev): 15/15 ✅
- GitHub (paid_dev): 0/15 ❌

---

## 🔄 次回点検予定

**次回実行:** 2025-12-17 06:00:00 JST

**点検項目:**
- 上記推奨アクションの実施状況確認
- 全サービスの稼働状況再確認
- エラーログの継続監視

---

**レポート生成:** Manus Automation  
**生成日時:** 2025-12-16 06:08:16 JST
