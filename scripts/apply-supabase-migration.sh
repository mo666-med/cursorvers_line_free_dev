#!/bin/bash
# Supabaseマイグレーション適用スクリプト

set -euo pipefail

PROJECT_REF="haaxgwyimoqzzxzdaeep"
MIGRATION_FILE="database/migrations/0001_init_tables.sql"

echo "## 🔧 Supabaseマイグレーション適用スクリプト"
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
  echo "   インストール: https://supabase.com/docs/reference/cli/installing-the-cli"
  exit 1
fi

echo "✅ Supabase CLIが見つかりました: $(supabase --version)"
echo ""

# プロジェクトリンクの確認
if [ ! -f "supabase/.temp/project-ref" ]; then
  echo "📋 プロジェクトをリンク中..."
  echo "   supabase link --project-ref $PROJECT_REF"
  echo ""
  echo "⚠️  まず、以下のコマンドを手動で実行してください:"
  echo "   1. supabase login"
  echo "   2. supabase link --project-ref $PROJECT_REF"
  echo ""
  read -p "リンクが完了しましたか？ (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ リンクが完了していません。後で実行してください。"
    exit 1
  fi
fi

echo "🚀 マイグレーションを実行中..."
supabase db push

echo ""
echo "✅ マイグレーションが完了しました！"
echo ""
echo "### 確認" && echo "Supabase Dashboardでテーブルが作成されているか確認してください:"
echo "  https://supabase.com/dashboard/project/$PROJECT_REF/editor"

