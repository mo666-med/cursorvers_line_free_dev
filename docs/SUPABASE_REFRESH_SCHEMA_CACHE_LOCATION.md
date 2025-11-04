# Supabase Dashboardでのスキーマキャッシュリフレッシュ方法

## 🔍 ボタンの場所

Supabase DashboardのUIはバージョンによって異なる場合があります。以下の場所を確認してください。

### 方法1: Settings → API（最も一般的）

1. **Supabase Dashboardを開く**
   ```
   https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep
   ```

2. **左サイドバーから「Settings」（⚙️ 歯車アイコン）をクリック**

3. **「API」タブをクリック**

4. **「Refresh Schema Cache」または「Reload Schema」ボタンを探す**
   - 通常、ページの下部や「PostgREST」セクションにあります
   - ボタン名は「Refresh Schema Cache」「Reload Schema」「Clear Cache」など、バージョンによって異なります

### 方法2: Database → Schema

1. **左サイドバーから「Database」をクリック**

2. **「Schema」タブをクリック**

3. **「Refresh」または「Reload Schema」ボタンを探す**

### 方法3: SQL Editorから実行（代替方法）

もしボタンが見つからない場合、SQL Editorから直接実行できます：

1. **SQL Editorを開く**
   ```
   https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep/sql/new
   ```

2. **以下のSQLを実行**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

   または

   ```sql
   SELECT pg_notify('pgrst', 'reload schema');
   ```

### 方法4: 自動更新を待つ

スキーマキャッシュは通常、数分で自動更新されます。
- 5-10分待ってから再度ワークフローを実行することもできます

## 📋 確認方法

リフレッシュ後、以下のSQLでカラムが存在することを確認:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'line_members'
AND column_name = 'consent_guardrail';
```

## ✅ 次のステップ

スキーマキャッシュをリフレッシュ後、再度ワークフローを実行:

```bash
gh workflow run line-event.yml --ref phase2/t8-kpi-report
```

