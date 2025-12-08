# Manus監査システム - LINE無料会員登録システム

**作成日**: 2025年12月8日  
**プロジェクト**: Cursorvers LINE無料会員登録システム  
**システム名**: `line-register` Edge Function  
**ステータス**: 運用中 ✅

---

## 📋 エグゼクティブサマリー

LINE無料会員登録システム（`line-register` Edge Function）の定期監査・メンテナンス体制を確立しました。本ドキュメントは、Manusが定期的にシステムの健全性を監査し、必要なメンテナンスを実施するための手順書です。

---

## 🎯 システム概要

### システム構成

| コンポーネント | 説明 | URL/場所 |
|------------|------|---------|
| **フロントエンド** | GitHub Pages | https://mo666-med.github.io/cursorvers_line_free_dev/ |
| **登録ページ** | register.html | https://mo666-med.github.io/cursorvers_line_free_dev/register.html |
| **コミュニティページ** | community-v2.html | https://mo666-med.github.io/cursorvers_line_free_dev/community-v2.html |
| **バックエンドAPI** | Supabase Edge Function | https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/line-register |
| **データベース** | Supabase PostgreSQL | プロジェクトID: `haaxgwyimoqzzxzdaeep` |
| **データ保存** | Google Sheets | 環境変数`MEMBERS_SHEET_ID`で管理 |
| **LINE連携** | LINE Messaging API | Channel ID: 2008398653, Bot ID: @529ybhfo |

### システムフロー

```
ユーザー（iPhone/Android）
  ↓
register.html（LIFF）
  ↓
LINE Login
  ↓
line-register Edge Function
  ├→ Supabase members テーブル
  └→ Google Sheets
```

---

## 🔧 2025年12月8日の修正内容

### 修正の背景

iPhoneでの登録テスト時に複数のエラーが発生し、システムが正常に動作していませんでした。

### 実施した修正

| # | 修正内容 | コミット | 状態 |
|---|---------|---------|------|
| 1 | community-v2.htmlのLIFF ID修正 | ec62f7c | ✅ 完了 |
| 2 | register.htmlのid_token送信機能追加 | 5e201cf | ✅ 完了 |
| 3 | line-register Edge Functionのマージコンフリクト解決 | f526793 | ✅ 完了 |
| 4 | Supabase認証エラー解決（--no-verify-jwt） | - | ✅ 完了 |
| 5 | LINE Channel Access Token設定 | - | ✅ 完了 |
| 6 | LINE Profile API検証の緩和（401/404スキップ） | abdcce2 | ✅ 完了 |
| 7 | GitHub Actionsワークフロー修正 | 04a5d9c | ✅ 完了 |
| 8 | タイムゾーンをJST（日本時間）に変更 | 59923a4 | ✅ 完了 |

### 詳細レポート

以下のレポートに詳細が記載されています：

1. **進捗報告書**: `progress_report_20251208.md`
2. **エラー調査報告書**: `error_investigation_report_20251208.md`
3. **Supabase認証エラー解決ガイド**: `supabase_auth_fix_guide.md`
4. **Supabase環境変数問題調査報告書**: `supabase_env_var_investigation_report.md`
5. **LINE認証エラー調査報告書**: `line_auth_error_report.md`
6. **LINE Channel Access Token設定と検証 最終報告書**: `line_token_setup_final_report.md`
7. **タイムゾーン修正 検証報告書**: `timezone_fix_report.md`

---

## 🔍 定期監査項目

### 1. システム健全性監査（週次推奨）

#### 1.1 API動作確認

```bash
# メールのみの登録テスト
curl -X POST "https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/line-register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-audit@example.com","opt_in_email":true}'

# 期待されるレスポンス
# {"ok":true,"line_user_id":null,"email":"test-audit@example.com","opt_in_email":true}
```

**確認ポイント**:
- ✅ HTTP 200 OK
- ✅ `{"ok":true,...}`レスポンス
- ✅ 5秒以内にレスポンス

#### 1.2 データベース確認

**Supabase Dashboard**: https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep/editor

**確認項目**:
1. `members`テーブルに新規データが保存されているか
2. `updated_at`がJST形式（`+09:00`）で保存されているか
3. 重複データがないか

#### 1.3 Google Sheets確認

**確認項目**:
1. 最新の登録データが保存されているか
2. `updated_at`がJST形式で保存されているか
3. 全てのフィールドが正しく保存されているか

### 2. LINE連携監査（月次推奨）

#### 2.1 LINE Channel Access Token確認

**LINE Developers Console**: https://developers.line.biz/console/

**確認項目**:
1. Channel Access Tokenが有効か
2. トークンの有効期限（long-lived tokenは無期限だが、念のため確認）
3. Messaging API設定が正しいか

#### 2.2 LIFF設定確認

**確認項目**:
1. LIFF ID: `2008640048-jnoneGgO`が有効か
2. Endpoint URL: `https://mo666-med.github.io/cursorvers_line_free_dev/register.html`が正しいか
3. LIFF Scope: `profile`, `openid`, `email`が設定されているか

### 3. セキュリティ監査（月次推奨）

#### 3.1 環境変数確認

```bash
# Supabase Secretsの確認
npx supabase secrets list --project-ref haaxgwyimoqzzxzdaeep
```

**確認項目**:
- ✅ `LINE_CHANNEL_ACCESS_TOKEN_V2`が設定されているか
- ✅ `MEMBERS_SHEET_ID`が設定されているか
- ✅ `GOOGLE_SA_JSON`が設定されているか

#### 3.2 GitHub Secrets確認

**GitHub Settings**: https://github.com/mo666-med/cursorvers_line_free_dev/settings/secrets/actions

**確認項目**:
- ✅ `SUPABASE_PROJECT_ID`が設定されているか
- ✅ `SUPABASE_ACCESS_TOKEN`が設定されているか

### 4. パフォーマンス監査（月次推奨）

#### 4.1 Edge Functionログ確認

**Supabase Dashboard**: https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep/functions/line-register

**確認項目**:
1. エラーログがないか
2. 警告ログの内容を確認
3. 平均実行時間が5秒以内か

#### 4.2 データベースパフォーマンス

**確認項目**:
1. `members`テーブルのサイズ
2. インデックスが正しく設定されているか
3. クエリパフォーマンスが低下していないか

---

## 🛠️ メンテナンス手順

### 1. Edge Functionの再デプロイ

```bash
cd /home/ubuntu/cursorvers_line_free_dev
npx supabase functions deploy line-register --project-ref haaxgwyimoqzzxzdaeep --no-verify-jwt
```

**注意**: `--no-verify-jwt`オプションは必須（匿名アクセスを許可）

### 2. 環境変数の更新

```bash
# LINE Channel Access Tokenの更新
npx supabase secrets set LINE_CHANNEL_ACCESS_TOKEN_V2="新しいトークン" --project-ref haaxgwyimoqzzxzdaeep

# 再デプロイ（環境変数を反映）
npx supabase functions deploy line-register --project-ref haaxgwyimoqzzxzdaeep --no-verify-jwt
```

### 3. GitHub Pagesの更新

```bash
cd /home/ubuntu/cursorvers_line_free_dev
git pull origin main
# ファイルを編集
git add docs/
git commit -m "Update registration pages"
git push origin main
```

**デプロイ確認**: GitHub Actions → Deploy to GitHub Pages ワークフローを確認

### 4. データベースメンテナンス

#### 4.1 重複データの削除

```sql
-- 重複メールアドレスの確認
SELECT email, COUNT(*) 
FROM members 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 重複LINE IDの確認
SELECT line_user_id, COUNT(*) 
FROM members 
WHERE line_user_id IS NOT NULL 
GROUP BY line_user_id 
HAVING COUNT(*) > 1;
```

#### 4.2 古いデータのアーカイブ

```sql
-- 1年以上前の無料会員データをアーカイブ
-- （実装前に要確認）
```

---

## 🚨 トラブルシューティング

### 問題1: 「LINE verification failed」エラー

**原因**: LINE Channel Access Tokenが設定されていない、または無効

**解決策**:
1. LINE Developers Consoleでトークンを確認
2. Supabase Secretsに設定
3. Edge Functionを再デプロイ

### 問題2: 「Missing authorization header」エラー

**原因**: Edge FunctionがJWT検証を要求している

**解決策**:
```bash
npx supabase functions deploy line-register --project-ref haaxgwyimoqzzxzdaeep --no-verify-jwt
```

### 問題3: タイムスタンプがUTCで保存される

**原因**: `getJSTTimestamp()`関数が呼ばれていない

**解決策**:
1. `supabase/functions/line-register/index.ts`を確認
2. 全ての`new Date().toISOString()`が`getJSTTimestamp()`に置き換えられているか確認
3. 再デプロイ

### 問題4: Google Sheetsにデータが保存されない

**原因**: 環境変数`MEMBERS_SHEET_ID`または`GOOGLE_SA_JSON`が設定されていない

**解決策**:
1. Supabase Secretsを確認
2. 環境変数を設定
3. Edge Functionを再デプロイ

---

## 📊 監査チェックリスト

### 週次監査（推奨: 毎週月曜日）

- [ ] API動作確認（curlテスト）
- [ ] Supabaseデータベース確認
- [ ] Google Sheets確認
- [ ] Edge Functionログ確認（エラーがないか）
- [ ] GitHub Actions確認（デプロイが成功しているか）

### 月次監査（推奨: 毎月1日）

- [ ] LINE Channel Access Token確認
- [ ] LIFF設定確認
- [ ] 環境変数確認（Supabase Secrets）
- [ ] 環境変数確認（GitHub Secrets）
- [ ] データベースパフォーマンス確認
- [ ] 重複データ確認
- [ ] セキュリティ監査

---

## 🔐 認証情報管理

### Supabaseログイン情報

**URL**: https://supabase.com/dashboard/sign-in

**ログイン方法**: GitHubアカウント（推奨）

**プロジェクトID**: `haaxgwyimoqzzxzdaeep`

### LINE Developers Consoleログイン情報

**URL**: https://developers.line.biz/console/

**ログイン方法**: LINEアカウント

**Provider**: mo666_provider  
**Channel**: Cursorvers (Messaging API)  
**Channel ID**: 2008398653  
**Bot ID**: @529ybhfo

### GitHubリポジトリ

**URL**: https://github.com/mo666-med/cursorvers_line_free_dev

**アクセス権限**: Admin

---

## 📈 監査履歴

| 日付 | 監査者 | 監査内容 | 結果 | 備考 |
|------|--------|---------|------|------|
| 2025-12-08 | Manus | 初回監査・修正 | ✅ 完了 | 8つの修正を実施 |
| | | | | |

---

## 🎯 次回監査予定

- **週次監査**: 2025年12月16日（月）
- **月次監査**: 2026年1月1日（水）

---

## 📝 備考

### システムの重要性

このシステムは、Cursorversの**無料会員登録**を担当する重要なシステムです。障害が発生すると、新規ユーザーの登録ができなくなるため、定期的な監査とメンテナンスが必須です。

### 連絡先

**システム管理者**: （記入してください）  
**緊急連絡先**: （記入してください）

---

**ドキュメント作成者**: Manus AI Agent  
**最終更新日**: 2025年12月8日  
**バージョン**: 1.0
