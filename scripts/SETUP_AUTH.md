# 認証情報設定ガイド

データ保全確認機能を有効化するための認証情報設定ガイドです。

---

## 🔐 必要な認証情報

### 1. Supabase Service Role Key

**目的**: データベースのレコード数、最新データの更新日時を確認

**取得方法**:

1. Supabaseダッシュボードにアクセス
   - URL: https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep/settings/api

2. 「Service Role Key」をコピー
   - ⚠️ **注意**: Service Role Keyは秘密情報です。安全に管理してください。

3. 環境変数に設定

**ローカル環境**:
```bash
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**GitHub Actions**:
1. リポジトリの Settings → Secrets and variables → Actions
2. 「New repository secret」をクリック
3. Name: `SUPABASE_SERVICE_ROLE_KEY`
4. Value: Service Role Keyを貼り付け

**cron / サーバー環境**:
```bash
# ~/.bashrc または ~/.zshrc に追加
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 2. Google Service Account Key

**目的**: Google Sheetsのデータ行数、最終更新日時を確認

**取得方法**:

#### ステップ1: Google Cloud Projectの作成

1. Google Cloud Consoleにアクセス
   - URL: https://console.cloud.google.com/

2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）

#### ステップ2: Google Sheets APIの有効化

1. 「APIとサービス」→「ライブラリ」
2. 「Google Sheets API」を検索
3. 「有効にする」をクリック

#### ステップ3: Service Accountの作成

1. 「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「サービスアカウント」
3. サービスアカウント名を入力（例: `cursorvers-data-check`）
4. 「作成して続行」をクリック
5. ロールは不要（スキップ）
6. 「完了」をクリック

#### ステップ4: Service Account Keyの作成

1. 作成したサービスアカウントをクリック
2. 「キー」タブ → 「鍵を追加」→「新しい鍵を作成」
3. キーのタイプ: JSON
4. 「作成」をクリック
5. JSONファイルがダウンロードされます

#### ステップ5: Google Sheetsへのアクセス権限付与

1. Google Sheetsを開く
   - URL: https://docs.google.com/spreadsheets/d/1mSpu4NMfa8cI7ohYATzIo2jwnD7nqW5rzkcHQobKoaY

2. 「共有」をクリック

3. Service Accountのメールアドレスを追加
   - 形式: `cursorvers-data-check@project-id.iam.gserviceaccount.com`
   - 権限: 閲覧者（Viewer）

4. 「送信」をクリック

#### ステップ6: 環境変数に設定

**ローカル環境**:
```bash
export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**GitHub Actions**:
1. リポジトリの Settings → Secrets and variables → Actions
2. 「New repository secret」をクリック
3. Name: `GOOGLE_SERVICE_ACCOUNT_KEY`
4. Value: JSONファイルの内容を貼り付け

**cron / サーバー環境**:
```bash
# ~/.bashrc または ~/.zshrc に追加
export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

---

## 🧪 設定確認

### Supabase認証の確認

```bash
curl -s "${SUPABASE_URL}/rest/v1/users?select=count" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Range: 0-0" \
  -H "Prefer: count=exact"
```

成功すると、以下のようなレスポンスが返ります：
```json
[{"count":123}]
```

### Google Sheets認証の確認

```bash
# 認証情報を一時ファイルに保存
echo "$GOOGLE_SERVICE_ACCOUNT_KEY" > /tmp/service-account.json

# Google Sheets APIを呼び出し
curl -s "https://sheets.googleapis.com/v4/spreadsheets/1mSpu4NMfa8cI7ohYATzIo2jwnD7nqW5rzkcHQobKoaY" \
  -H "Authorization: Bearer $(gcloud auth print-access-token --impersonate-service-account=$(cat /tmp/service-account.json | jq -r .client_email))"

# 一時ファイルを削除
rm /tmp/service-account.json
```

---

## 📋 設定チェックリスト

### Supabase

- [ ] Supabaseダッシュボードにアクセス
- [ ] Service Role Keyを取得
- [ ] 環境変数 `SUPABASE_SERVICE_ROLE_KEY` に設定
- [ ] 設定確認コマンドで動作確認

### Google Sheets

- [ ] Google Cloud Projectを作成
- [ ] Google Sheets APIを有効化
- [ ] Service Accountを作成
- [ ] Service Account Keyを作成（JSON）
- [ ] Google SheetsにService Accountのアクセス権限を付与
- [ ] 環境変数 `GOOGLE_SERVICE_ACCOUNT_KEY` に設定
- [ ] 設定確認コマンドで動作確認

---

## 🚀 スクリプト実行

認証情報を設定した後、以下のコマンドでスクリプトを実行します：

```bash
cd /path/to/cursorvers_line_paid_dev
./scripts/daily-check-v3.sh
```

認証情報が正しく設定されていれば、以下のような出力が表示されます：

```
🔍 3. Supabaseデータ保全確認...
   認証情報あり - 詳細確認を実行
✅ Supabase: データ保全確認済み
   users: 123件
   members: 45件
   interaction_logs: 678件
   最新ログ: 2025-12-13T12:34:56.789Z

🔍 4. Google Sheetsデータ保全確認...
   認証情報あり - 詳細確認を実行
✅ Google Sheets: 認証情報確認済み
```

---

## 🔒 セキュリティ注意事項

1. **Service Role Keyは秘密情報です**
   - GitHubにコミットしないでください
   - `.gitignore`に追加してください
   - 環境変数またはシークレット管理サービスを使用してください

2. **Service Account Keyは秘密情報です**
   - JSONファイルをGitHubにコミットしないでください
   - 環境変数またはシークレット管理サービスを使用してください

3. **最小権限の原則**
   - Service Accountには必要最小限の権限のみを付与してください
   - Google Sheetsへのアクセス権限は「閲覧者」で十分です

4. **定期的なローテーション**
   - 認証情報は定期的に更新してください
   - 漏洩の疑いがある場合は即座に無効化してください

---

## 📞 トラブルシューティング

### Supabase認証エラー

**エラー**: `Unauthorized`

**原因**:
- Service Role Keyが間違っている
- Service Role Keyが期限切れ

**解決方法**:
1. Supabaseダッシュボードで新しいService Role Keyを取得
2. 環境変数を更新
3. スクリプトを再実行

### Google Sheets認証エラー

**エラー**: `403 Forbidden`

**原因**:
- Service AccountにGoogle Sheetsへのアクセス権限がない
- Google Sheets APIが有効化されていない

**解決方法**:
1. Google SheetsでService Accountのメールアドレスを共有
2. Google Cloud ConsoleでGoogle Sheets APIを有効化
3. スクリプトを再実行

---

## 📚 参考資料

- [Supabase API Documentation](https://supabase.com/docs/guides/api)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)

---

*このドキュメントは自動生成されました。*
