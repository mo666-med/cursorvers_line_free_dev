#!/bin/bash
# scripts/setup-manus-env.sh
# GitHub Secretsから値を取得して.envファイルに設定するスクリプト

cd "$(dirname "$0")/.."

echo "📋 Manus API環境変数の設定を開始..."
echo ""

# MANUS_API_KEY
echo "1. MANUS_API_KEYを取得中..."
MANUS_API_KEY_VALUE=$(gh secret get MANUS_API_KEY 2>/dev/null | grep -v '^Warning:' | head -1)
if [ -n "$MANUS_API_KEY_VALUE" ]; then
  if grep -q "^MANUS_API_KEY=" .env 2>/dev/null; then
    sed -i.bak "s|^MANUS_API_KEY=.*|MANUS_API_KEY=$MANUS_API_KEY_VALUE|" .env
    echo "   ✅ MANUS_API_KEYを.envに更新しました"
  else
    echo "MANUS_API_KEY=$MANUS_API_KEY_VALUE" >> .env
    echo "   ✅ MANUS_API_KEYを.envに追加しました"
  fi
else
  echo "   ⚠️  MANUS_API_KEYを取得できませんでした"
  echo "   💡 GitHub CLIで認証してください: gh auth login"
fi

# PROGRESS_WEBHOOK_URL
echo "2. PROGRESS_WEBHOOK_URLを取得中..."
PROGRESS_WEBHOOK_URL_VALUE=$(gh secret get PROGRESS_WEBHOOK_URL 2>/dev/null | grep -v '^Warning:' | head -1)
if [ -n "$PROGRESS_WEBHOOK_URL_VALUE" ]; then
  if grep -q "^PROGRESS_WEBHOOK_URL=" .env 2>/dev/null; then
    sed -i.bak "s|^PROGRESS_WEBHOOK_URL=.*|PROGRESS_WEBHOOK_URL=$PROGRESS_WEBHOOK_URL_VALUE|" .env
    echo "   ✅ PROGRESS_WEBHOOK_URLを.envに更新しました"
  else
    echo "PROGRESS_WEBHOOK_URL=$PROGRESS_WEBHOOK_URL_VALUE" >> .env
    echo "   ✅ PROGRESS_WEBHOOK_URLを.envに追加しました"
  fi
else
  echo "   ⚠️  PROGRESS_WEBHOOK_URLを取得できませんでした"
  echo "   💡 デフォルト値を使用: https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay"
  if ! grep -q "^PROGRESS_WEBHOOK_URL=" .env 2>/dev/null; then
    echo "PROGRESS_WEBHOOK_URL=https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay" >> .env
    echo "   ✅ デフォルト値を.envに追加しました"
  fi
fi

# MANUS_BASE_URL（固定値）
echo "3. MANUS_BASE_URLを設定中..."
if grep -q "^MANUS_BASE_URL=" .env 2>/dev/null; then
  sed -i.bak "s|^MANUS_BASE_URL=.*|MANUS_BASE_URL=https://api.manus.im|" .env
  echo "   ✅ MANUS_BASE_URLを.envに更新しました"
else
  echo "MANUS_BASE_URL=https://api.manus.im" >> .env
  echo "   ✅ MANUS_BASE_URLを.envに追加しました"
fi

echo ""
echo "📋 設定完了！"
echo ""
echo "💡 環境変数を読み込むには:"
echo "   source .env"
echo "   または"
echo "   export \$(grep -v '^#' .env | xargs)"
echo ""
echo "🔍 設定を確認:"
echo "   grep -E 'MANUS_API_KEY|MANUS_BASE_URL|PROGRESS_WEBHOOK_URL' .env | sed 's/=.*/=***/'"

