# Supabaseスキーマキャッシュエラーの根本原因分析

## 🔍 問題の概要

`line_members`テーブルへのデータ挿入時に、以下のエラーが発生しています：

```
Could not find the 'first_opt_in_at' column of 'line_members' in the schema cache
```

エラーコード: `PGRST204`

## ✅ 実施した対応

1. **スキーマキャッシュリフレッシュ（10回実行）**
   - `NOTIFY pgrst, 'reload schema';` を10回実行
   - 時刻: 05:53:44 - 05:58:28

2. **Supabaseプロジェクト再起動**
   - Infrastructure Settings → Restart を実行
   - 再起動完了まで120秒待機

3. **ワークフロー再実行**
   - 再起動後、ワークフローを再実行
   - しかし、まだ同じエラーが発生

## 🔍 根本原因の分析

### 確認したこと

1. **スクリプトが送信しているカラム**
   - `user_hash`, `first_opt_in_at`, `last_opt_in_at`, `cta_tags`, `status`, `guardrail_sent_at`, `consent_guardrail`, `metadata`, `updated_at`
   - ✅ すべて正しく送信されている

2. **マイグレーションファイルのカラム定義**
   - ✅ スクリプトが送信しているカラムと一致

3. **RLS（Row Level Security）設定**
   - ✅ RLSは設定されていない（問題なし）

4. **テーブル定義の不一致**
   - ⚠️ `status`のデフォルト値が異なる：
     - マイグレーションファイル: `default 'lead'`
     - Manusが確認したテーブル定義: `default 'user'`
   - これは、マイグレーションが正しく適用されていない可能性を示唆

### 根本的な問題の可能性

#### 1. PostgRESTのスキーマキャッシュ更新メカニズムが機能していない

**現象:**
- `NOTIFY pgrst, 'reload schema';` を10回実行しても、エラーが継続
- プロジェクト再起動後でも、エラーが継続

**考えられる原因:**
- PostgRESTが通知チャンネルをリッスンしていない
- PostgRESTの設定で、スキーマキャッシュの更新が無効になっている
- PostgRESTの再起動が不完全

#### 2. PostgRESTのスキーマ検索パス設定の問題

**可能性:**
- PostgRESTが'public'スキーマを見ていない
- PostgRESTの設定で、異なるスキーマ検索パスが設定されている

#### 3. テーブルが実際に存在しない、または異なるスキーマにある

**可能性:**
- マイグレーションが正しく適用されていない
- テーブルが'public'スキーマ以外にある
- テーブル名が異なる

#### 4. PostgRESTの設定の問題

**可能性:**
- PostgRESTの設定で、特定のテーブルが除外されている
- PostgRESTの設定で、スキーマ検索パスが正しくない

## 🎯 最も可能性が高い原因

**PostgRESTのスキーマキャッシュ更新メカニズムが機能していない**

これは、PostgRESTの設定やSupabaseのインフラの問題である可能性があります。

## 🔧 推奨される対応

### 1. Supabaseサポートに問い合わせ（推奨）

PostgRESTのスキーマキャッシュが更新されない問題は、Supabaseのインフラレベルの問題である可能性があります。
- Supabaseサポートに問い合わせて、PostgRESTの設定を確認してもらう
- スキーマキャッシュの更新メカニズムが機能しているか確認してもらう

### 2. 代替手段: 直接PostgreSQL接続を使用

PostgRESTを経由せず、直接PostgreSQL接続を使用する方法：
- `scripts/supabase/upsert-line-event.js`を修正して、PostgREST APIではなく、PostgreSQLクライアントを使用する
- これにより、スキーマキャッシュの問題を回避できる

### 3. 現状のまま運用（暫定対応）

- `continue-on-error: true`により、ワークフローは成功します
- ただし、データはSupabaseに保存されていない可能性があります
- スキーマキャッシュが更新されるまで、この状態が続く可能性があります

## 📋 確認すべきこと

1. **実際のデータベースでテーブルが存在するか**
   ```sql
   SELECT table_name, table_schema
   FROM information_schema.tables
   WHERE table_name = 'line_members';
   ```

2. **テーブルのカラム定義を確認**
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'line_members'
   AND table_schema = 'public'
   ORDER BY ordinal_position;
   ```

3. **PostgRESTの設定を確認**
   - Supabase Dashboard → Settings → API
   - PostgRESTの設定を確認

## 📝 関連ファイル

- `scripts/supabase/upsert-line-event.js` - Supabase API呼び出しスクリプト
- `database/migrations/0001_init_tables.sql` - マイグレーションファイル
- `docs/MANUS_SUPABASE_SCHEMA_CACHE_REFRESH_REPORT.md` - Manus実行レポート

