# Supabaseマイグレーション実行ガイド

## 🔍 問題

ワークフロー実行時に以下のエラーが発生しています：
```
Could not find the table 'public.progress_events' in the schema cache
```

## ✅ 解決方法

Supabaseデータベースにマイグレーションを適用する必要があります。

### 方法1: Supabase CLIを使用（推奨）

```bash
# 1. Supabase CLIがインストールされているか確認
supabase --version

# 2. Supabaseプロジェクトにログイン（初回のみ）
supabase login

# 3. プロジェクトをリンク（初回のみ、またはプロジェクト参照IDが変更された場合）
supabase link --project-ref haaxgwyimoqzzxzdaeep

# 4. マイグレーションを実行
supabase db push

# 注意: linkコマンドが失敗する場合は、アクセストークンが必要です
# supabase link --project-ref haaxgwyimoqzzxzdaeep --password <database-password>

# または、特定のマイグレーションファイルを実行
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.haaxgwyimoqzzxzdaeep.supabase.co:5432/postgres"
```

### 方法2: Supabase Dashboardから実行

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep

2. **SQL Editorを開く**

3. **マイグレーションファイルの内容をコピー＆ペースト**
   ```bash
   cat database/migrations/0001_init_tables.sql
   ```

4. **SQLを実行**

### 方法3: psqlで直接実行

```bash
# 環境変数から接続情報を取得
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.haaxgwyimoqzzxzdaeep.supabase.co:5432/postgres"

# マイグレーションを実行
psql "$SUPABASE_DB_URL" -f database/migrations/0001_init_tables.sql
```

## 📋 マイグレーション内容

`database/migrations/0001_init_tables.sql` には以下のテーブルが含まれています：

1. **progress_events**: イベントと進捗の記録
2. **budget_snapshots**: 予算スナップショット
3. **line_members**: LINE会員情報
4. **kpi_snapshots**: KPIスナップショット
5. **line_conversion_kpi()**: KPI集計関数

## ✅ マイグレーション実行後の確認

```bash
# Supabase DashboardのSQL Editorで確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('progress_events', 'line_members', 'budget_snapshots', 'kpi_snapshots');
```

## 🔗 関連情報

- Supabase CLIドキュメント: https://supabase.com/docs/reference/cli
- マイグレーションファイル: `database/migrations/0001_init_tables.sql`

