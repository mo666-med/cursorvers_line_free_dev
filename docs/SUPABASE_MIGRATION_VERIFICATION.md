# Supabaseマイグレーション検証ガイド

## 🔍 マイグレーション実行の確認方法

### 方法1: Table Editorで確認

1. Supabase DashboardのTable Editorを開く:
   ```
   https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep/editor
   ```

2. 以下のテーブルが存在することを確認:
   - `progress_events`
   - `line_members`
   - `budget_snapshots`
   - `kpi_snapshots`

### 方法2: SQL Editorで確認

1. SQL Editorを開く:
   ```
   https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep/sql/new
   ```

2. 以下のSQLを実行してテーブル一覧を確認:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('progress_events', 'line_members', 'budget_snapshots', 'kpi_snapshots');
```

3. `line_members`テーブルのカラムを確認:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'line_members'
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### 期待される`line_members`テーブルのカラム

- `user_hash` (text, PRIMARY KEY)
- `first_opt_in_at` (timestamptz, NOT NULL)
- `last_opt_in_at` (timestamptz, nullable)
- `cta_tags` (text[], NOT NULL, default '{}')
- `status` (text, NOT NULL, default 'lead')
- `guardrail_sent_at` (timestamptz, nullable)
- `consent_guardrail` (boolean, NOT NULL, default false) ← **重要**
- `metadata` (jsonb, NOT NULL, default '{}')
- `created_at` (timestamptz, NOT NULL, default now())
- `updated_at` (timestamptz, NOT NULL, default now())

## ❌ エラーが発生している場合

### エラーメッセージ
```
Could not find the 'consent_guardrail' column of 'line_members' in the schema cache
```

### 解決方法

1. **マイグレーションSQLを再実行**
   - `docs/SUPABASE_MIGRATION_SQL.md`のSQLを再度実行

2. **テーブルが存在するが、カラムが不足している場合**
   - 以下のSQLを実行してカラムを追加:

```sql
ALTER TABLE line_members
ADD COLUMN IF NOT EXISTS consent_guardrail boolean NOT NULL DEFAULT false;
```

3. **Supabaseのスキーマキャッシュをリフレッシュ**
   - Supabase Dashboard → Settings → API → "Refresh Schema Cache"をクリック

## ✅ マイグレーション実行後の確認

1. すべてのテーブルが作成されている
2. `line_members`テーブルに`consent_guardrail`カラムが存在する
3. インデックスが作成されている
4. 関数`line_conversion_kpi()`が作成されている

確認後、再度ワークフローを実行:

```bash
gh workflow run line-event.yml --ref phase2/t8-kpi-report
```

