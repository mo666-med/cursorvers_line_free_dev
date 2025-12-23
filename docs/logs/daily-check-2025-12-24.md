# 📊 Cursorvers 日次システム点検レポート

**日時**: 2025-12-24 06:06:03 JST

---

## 点検結果サマリー

| 項目 | 状態 | 詳細 |
|------|------|------|
| LINE Bot | ✅ OK | 正常稼働（HTTP 200） |
| Discord Webhook | ⚠️ SKIP | Webhook URL未設定 |
| Supabase | ⚠️ SKIP | アクセストークン未設定 |
| n8n Workflow | ⚠️ SKIP | API認証エラー |
| Google Sheets | ⚠️ SKIP | n8n経由での確認不可 |
| GitHub (free_dev) | ✅ OK | 最新コミット確認済み |
| GitHub (paid_dev) | ❌ NG | リポジトリが存在しない |

---

## 詳細レポート

### 1. LINE Bot (Supabase Edge Functions)

**エンドポイント**: `https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/line-webhook`

**テスト結果**:
```
HTTP Status: 200
Response: OK - line-webhook is running
```

**判定**: ✅ 正常稼働

---

### 2. Discord Webhook

**状態**: ⚠️ 設定不足

**詳細**: 
- 環境変数 `DISCORD_WEBHOOK_URL` が設定されていません
- ユーザー提供情報には招待リンク（https://discord.gg/AnqkRuS5）のみが含まれており、Webhook URL（https://discord.com/api/webhooks/...）が不明です

**推奨アクション**:
- Discord Webhookを設定し、環境変数に登録してください

---

### 3. Supabase

**プロジェクトID**: haaxgwyimoqzzxzdaeep

**状態**: ⚠️ アクセス制限

**詳細**:
- Supabase CLIおよびMCPサーバーの認証に必要なアクセストークンが設定されていません
- Edge Functionsのログ確認ができませんでした

**推奨アクション**:
- `SUPABASE_ACCESS_TOKEN` 環境変数を設定してください

---

### 4. n8n Workflow

**インスタンスURL**: 環境変数 `N8N_INSTANCE_URL` より取得

**状態**: ⚠️ API認証エラー

**詳細**:
- n8n API呼び出し時にHTMLページが返されました
- API keyが正しく認証されていない可能性があります

**推奨アクション**:
- `N8N_API_KEY` の有効性を確認してください
- n8nインスタンスのAPI設定を確認してください

---

### 5. Google Sheets

**状態**: ⚠️ 確認不可

**詳細**:
- n8n Workflow経由での確認を予定していましたが、n8n APIの認証エラーにより確認できませんでした

**推奨アクション**:
- n8n APIの認証問題を解決後、再度確認してください

---

### 6. GitHub リポジトリ

#### cursorvers_line_free_dev

**状態**: ✅ 正常

**最新コミット情報**:
- **SHA**: b7aefe9
- **メッセージ**: docs: Add daily system check log (2025-12-22)
- **作成者**: Manus Automation
- **日時**: 2025-12-22T21:08:53Z

**最終更新**: 2025-12-22T21:08:58Z

#### cursorvers_line_paid_dev

**状態**: ❌ リポジトリが存在しない

**詳細**:
- GitHubで `mo666-med/cursorvers_line_paid_dev` リポジトリが見つかりませんでした

**推奨アクション**:
- リポジトリ名が変更されているか確認してください
- 必要に応じて新規作成してください

---

## 自動修繕の実行

**実行内容**: なし

**理由**: 
- LINE Bot Edge Functionは正常稼働しているため、再デプロイの必要はありません
- その他の問題は設定不足によるものであり、自動修繕の対象外です

---

## 推奨事項

1. **Discord Webhook URL の設定**: 報告機能を有効化するため、正しいWebhook URLを環境変数に設定してください

2. **Supabase アクセストークンの設定**: Edge Functionsのログ監視を有効化するため、アクセストークンを設定してください

3. **n8n API認証の確認**: Google Sheets連携の監視を有効化するため、API keyの有効性を確認してください

4. **cursorvers_line_paid_dev リポジトリの確認**: リポジトリの存在を確認し、必要に応じて作成または名称を修正してください

---

## 次回点検予定

**日時**: 2025-12-25 06:00:00 JST（午前6時）

---

*このレポートは自動生成されました*
