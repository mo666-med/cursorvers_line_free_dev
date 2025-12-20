# 障害復旧ランブック

このドキュメントでは、Cursorvers LINE Daily Brief システムで発生する可能性のある障害と、その復旧手順を説明します。

## 目次

1. [監査システム障害](#1-監査システム障害)
2. [Edge Function デプロイ障害](#2-edge-function-デプロイ障害)
3. [LINE配信障害](#3-line配信障害)
4. [Discord通知障害](#4-discord通知障害)
5. [n8n連携障害](#5-n8n連携障害)
6. [カード在庫枯渇](#6-カード在庫枯渇)
7. [データベース障害](#7-データベース障害)

---

## 1. 監査システム障害

### 症状
- 日次監査がDiscordに通知されない
- GitHub Actions の `manus-audit-daily` ワークフローが失敗

### 診断手順

```bash
# 1. ワークフロー実行履歴を確認
gh run list --workflow "Manus Audit (Daily)" --limit 5

# 2. 失敗したランの詳細を確認
gh run view <run-id> --log

# 3. 監査関数のヘルスチェック
curl -s -X POST "${SUPABASE_URL}/functions/v1/manus-audit-line-daily-brief?mode=health" \
  -H "Authorization: Bearer ${MANUS_AUDIT_API_KEY}"
```

### 復旧手順

#### ケース A: 環境変数が未設定
```bash
# GitHub Secretsを確認
gh secret list

# 必要なシークレットを設定
gh secret set SUPABASE_URL --body "<value>"
gh secret set MANUS_AUDIT_API_KEY --body "<value>"
```

#### ケース B: Edge Function がデプロイされていない
```bash
npx supabase functions deploy manus-audit-line-daily-brief --project-ref haaxgwyimoqzzxzdaeep
```

#### ケース C: APIキーが無効
1. Supabase ダッシュボードで新しいAPIキーを生成
2. GitHub Secret を更新
3. ワークフローを再実行

---

## 2. Edge Function デプロイ障害

### 症状
- デプロイワークフローが失敗
- 一部の関数のみ失敗

### 診断手順

```bash
# 1. デプロイワークフローの結果を確認
gh run list --workflow "Deploy Supabase Edge Functions" --limit 3

# 2. 詳細ログを確認
gh run view <run-id> --log

# 3. ローカルでデプロイをテスト
npx supabase functions deploy <function-name> --project-ref haaxgwyimoqzzxzdaeep
```

### 復旧手順

#### ケース A: Supabase CLIバージョンの問題
```bash
# CLIをアップグレード
npm install -g supabase@latest

# 再デプロイ
npx supabase functions deploy <function-name> --project-ref haaxgwyimoqzzxzdaeep
```

#### ケース B: TypeScriptコンパイルエラー
```bash
# ローカルで型チェック
deno check supabase/functions/<function-name>/index.ts

# エラーを修正してコミット
```

#### ケース C: アクセストークン期限切れ
```bash
# Supabaseに再ログイン
npx supabase login

# 新しいトークンをGitHub Secretに設定
gh secret set SUPABASE_ACCESS_TOKEN --body "<new-token>"
```

---

## 3. LINE配信障害

### 症状
- ユーザーにLINE通知が届かない
- 配信成功率が低下

### 診断手順

```bash
# 1. 配信ログを確認
npx supabase functions logs line-daily-brief --project-ref haaxgwyimoqzzxzdaeep

# 2. データベースで配信状況を確認
# Supabase ダッシュボード → Table Editor → line_card_broadcasts

# 3. LINE Messaging APIの状態を確認
curl -s -X GET "https://api.line.me/v2/bot/info" \
  -H "Authorization: Bearer ${LINE_CHANNEL_ACCESS_TOKEN}"
```

### 復旧手順

#### ケース A: LINE Channel Access Token期限切れ
1. LINE Developers Console で新しいトークンを発行
2. Supabase Secretsを更新:
   ```bash
   npx supabase secrets set LINE_CHANNEL_ACCESS_TOKEN=<new-token> --project-ref haaxgwyimoqzzxzdaeep
   ```
3. Edge Functionを再デプロイ

#### ケース B: 配信カードが枯渇
→ [6. カード在庫枯渇](#6-カード在庫枯渇) を参照

#### ケース C: ユーザーがブロック
- 正常な動作です（ユーザーの意思を尊重）
- `line_users` テーブルで `blocked_at` を確認

---

## 4. Discord通知障害

### 症状
- Discordに通知が届かない
- Webhook呼び出しがエラー

### 診断手順

```bash
# 1. Webhook URLの有効性をテスト
curl -X POST "${DISCORD_ADMIN_WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '{"content": "テスト通知"}'

# 2. Edge Functionログを確認
npx supabase functions logs manus-audit-line-daily-brief --project-ref haaxgwyimoqzzxzdaeep
```

### 復旧手順

#### ケース A: Webhook URLが無効
1. Discord サーバーで新しいWebhookを作成
2. 環境変数を更新:
   ```bash
   gh secret set DISCORD_ADMIN_WEBHOOK_URL --body "<new-url>"
   npx supabase secrets set DISCORD_ADMIN_WEBHOOK_URL=<new-url> --project-ref haaxgwyimoqzzxzdaeep
   ```

#### ケース B: レート制限
- Discord Webhookは1分間に30リクエストまで
- 通知を集約するか、複数のWebhookを使用

---

## 5. n8n連携障害

### 症状
- 日次点検でn8nチェックが失敗（警告）
- n8nワークフローが実行されない

### 診断手順

```bash
# 1. n8n APIの疎通確認
curl -s --max-time 10 \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  "${N8N_INSTANCE_URL}/api/v1/workflows"

# 2. n8nインスタンスの状態確認
curl -s "${N8N_INSTANCE_URL}/healthz"
```

### 復旧手順

#### ケース A: n8nインスタンスがダウン
1. n8nホスティングサービスを確認
2. インスタンスを再起動
3. 必要に応じてバックアップから復元

#### ケース B: APIキーが無効
1. n8n管理画面で新しいAPIキーを生成
2. GitHub Secretを更新:
   ```bash
   gh secret set N8N_API_KEY --body "<new-key>"
   ```

**注意**: n8n障害は警告（WARNING）であり、システム全体の障害ではありません。

---

## 6. カード在庫枯渇

### 症状
- 監査で「readyカードが50枚未満」警告
- 配信時に「カードがありません」エラー

### 診断手順

```sql
-- Supabase SQL Editorで実行
SELECT theme, status, COUNT(*) as count
FROM line_cards
GROUP BY theme, status
ORDER BY theme, status;
```

### 復旧手順

#### 手動でカードを追加
```bash
# カード生成スクリプトがある場合
node scripts/generate-cards.js --theme <theme> --count 50

# または直接SQLで追加
# Supabase SQL Editorで実行
INSERT INTO line_cards (theme, content, status)
VALUES
  ('<theme>', '<content1>', 'ready'),
  ('<theme>', '<content2>', 'ready'),
  ...;
```

#### 使用済みカードをリセット（緊急時のみ）
```sql
-- 注意: これは緊急時のみ使用
UPDATE line_cards
SET status = 'ready', times_used = 0, last_used_at = NULL
WHERE theme = '<theme>' AND status = 'used';
```

---

## 7. データベース障害

### 症状
- Edge Functionがタイムアウト
- データベース接続エラー

### 診断手順

1. Supabase ダッシュボード → Database → Connection Pooling を確認
2. Database → Logs でエラーログを確認

### 復旧手順

#### ケース A: 接続プール枯渇
1. Supabase ダッシュボード → Database → Connection Pooling
2. Pool Modeを `transaction` に変更（推奨）
3. 必要に応じてプールサイズを増加

#### ケース B: データベース容量不足
1. 不要なデータをアーカイブまたは削除
2. Supabaseプランをアップグレード

---

## 緊急連絡先

| サービス | 連絡先 |
|---------|--------|
| Supabase | https://supabase.com/dashboard/support |
| LINE Developers | https://developers.line.biz/console/ |
| Discord | サーバー管理者に連絡 |
| GitHub Actions | https://www.githubstatus.com/ |

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2024-12-20 | 初版作成 |
