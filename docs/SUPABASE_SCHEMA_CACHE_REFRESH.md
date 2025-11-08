# Supabaseスキーマキャッシュリフレッシュガイド

## 🔍 問題

マイグレーションは成功しましたが、以下のエラーが発生しています：

```
Could not find the 'consent_guardrail' column of 'line_members' in the schema cache
```

## ✅ 原因

SupabaseのPostgREST（API層）がスキーマキャッシュを更新していないためです。

## 🔧 解決方法

### 方法1: スキーマキャッシュを手動でリフレッシュ（推奨）

1. **Supabase Dashboardを開く**
   ```
   https://supabase.com/dashboard/project/haaxgwyimoqzzxzdaeep
   ```

2. **Settings → API に移動**

3. **"Refresh Schema Cache" ボタンをクリック**

4. **リフレッシュ後、再度ワークフローを実行**
   ```bash
   gh workflow run line-event.yml --ref phase2/t8-kpi-report
   ```

### 方法2: 自動更新を待つ

スキーマキャッシュは通常、数分で自動更新されます。
- 5-10分待ってから再度ワークフローを実行

### 方法3: SQL Editorで確認

カラムが存在することを確認:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'line_members'
AND column_name = 'consent_guardrail';
```

結果が返ってくれば、カラムは存在しています。あとはスキーマキャッシュの更新を待つだけです。

## 📋 確認手順

1. **テーブルが作成されているか確認**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'line_members';
   ```

2. **カラムが存在するか確認**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'line_members'
   ORDER BY ordinal_position;
   ```

3. **スキーマキャッシュをリフレッシュ**

4. **ワークフローを再実行**

