#!/bin/bash
# Supabaseマイグレーションを直接実行するスクリプト（リンク不要）

set -euo pipefail

PROJECT_REF="haaxgwyimoqzzxzdaeep"
MIGRATION_FILE="database/migrations/0001_init_tables.sql"

echo "## 🔧 Supabaseマイグレーション直接実行スクリプト"
echo ""

# マイグレーションファイルの存在確認
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ マイグレーションファイルが見つかりません: $MIGRATION_FILE"
  exit 1
fi

echo "✅ マイグレーションファイルを確認: $MIGRATION_FILE"
echo ""

# Supabase CLIの確認
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLIがインストールされていません"
  exit 1
fi

echo "✅ Supabase CLI: $(supabase --version)"
echo ""

# 環境変数から接続情報を取得
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️  環境変数が設定されていません"
  echo ""
  echo "以下の環境変数を設定してください:"
  echo "  export SUPABASE_URL='https://haaxgwyimoqzzxzdaeep.supabase.co'"
  echo "  export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
  echo ""
  echo "または、.envファイルから読み込み:"
  echo "  source .env"
  echo ""
  exit 1
fi

# データベースURLを構築（Service Role Keyから）
DB_HOST="${SUPABASE_URL#https://}"
DB_HOST="${DB_HOST%%.supabase.co}"
DB_URL="postgresql://postgres.${DB_HOST}:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"

echo "⚠️  このスクリプトはデータベースパスワードが必要です"
echo ""
echo "Supabase Dashboardからデータベースパスワードを取得してください:"
echo "  https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
echo ""
echo "または、Supabase DashboardのSQL Editorから直接実行することを推奨します:"
echo "  https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "SQLファイルの内容:"
cat "$MIGRATION_FILE"
echo ""
echo "このSQLをSupabase DashboardのSQL Editorにコピー＆ペーストして実行してください。"

