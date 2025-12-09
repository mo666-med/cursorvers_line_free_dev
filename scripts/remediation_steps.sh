#!/bin/bash

# 有料課金導線 修繕作業スクリプト
# 作成日: 2025年12月8日

set -e

echo "=========================================="
echo "有料課金導線 修繕作業"
echo "=========================================="
echo ""

# 作業ディレクトリ
WORK_DIR="/home/ubuntu/cursorvers_line_free_dev"
cd "$WORK_DIR"

# プロジェクトID
PROJECT_REF="haaxgwyimoqzzxzdaeep"

echo "ステップ1: 現在の環境変数を確認"
echo "------------------------------------------"
npx supabase secrets list --project-ref "$PROJECT_REF" | grep STRIPE
echo ""

echo "ステップ2: Stripe APIキーとPrice IDの設定"
echo "------------------------------------------"
echo "⚠️  注意: 以下の値をStripe Dashboardから取得してください"
echo ""
echo "必要な情報:"
echo "  1. Stripe Dashboard → 開発者 → APIキー → テスト環境"
echo "     - 秘密鍵 (sk_test_で始まる)"
echo "  2. Stripe Dashboard → 製品 → 価格 → Library Member"
echo "     - 価格ID (price_test_で始まる)"
echo ""

# ユーザーに入力を求める
read -p "Stripe Test API Key (sk_test_...): " STRIPE_TEST_API_KEY
read -p "Stripe Test Price ID (price_test_...): " STRIPE_TEST_PRICE_ID

if [[ -z "$STRIPE_TEST_API_KEY" ]] || [[ -z "$STRIPE_TEST_PRICE_ID" ]]; then
    echo "❌ エラー: APIキーまたはPrice IDが入力されていません"
    exit 1
fi

echo ""
echo "ステップ3: Supabase環境変数を更新"
echo "------------------------------------------"
npx supabase secrets set STRIPE_API_KEY="$STRIPE_TEST_API_KEY" --project-ref "$PROJECT_REF"
npx supabase secrets set STRIPE_PRICE_ID_LIBRARY="$STRIPE_TEST_PRICE_ID" --project-ref "$PROJECT_REF"
echo "✅ 環境変数を更新しました"
echo ""

echo "ステップ4: Edge Functionsを再デプロイ"
echo "------------------------------------------"
npx supabase functions deploy create-checkout-session --project-ref "$PROJECT_REF"
npx supabase functions deploy stripe-webhook --project-ref "$PROJECT_REF"
echo "✅ Edge Functionsを再デプロイしました"
echo ""

echo "ステップ5: APIレベルのテスト"
echo "------------------------------------------"
echo "テストリクエストを送信..."
RESPONSE=$(curl -s -X POST https://haaxgwyimoqzzxzdaeep.functions.supabase.co/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-remediation-'$(date +%s)'@example.com",
    "opt_in_email": true,
    "agree_terms": true,
    "agree_privacy": true,
    "tier": "library"
  }')

echo "レスポンス:"
echo "$RESPONSE" | jq '.'
echo ""

# Session IDがcs_test_で始まるか確認
if echo "$RESPONSE" | grep -q "cs_test_"; then
    echo "✅ テストモードで正常に動作しています"
else
    echo "⚠️  警告: Session IDがcs_test_で始まっていません"
    echo "   本番モードで動作している可能性があります"
fi
echo ""

echo "=========================================="
echo "修繕作業が完了しました"
echo "=========================================="
echo ""
echo "次のステップ:"
echo "  1. Stripe Dashboard → Webhook → テストモード"
echo "     - エンドポイントURL: https://haaxgwyimoqzzxzdaeep.functions.supabase.co/stripe-webhook"
echo "     - イベント: checkout.session.completed"
echo "  2. E2Eテスト: https://cursorvers.github.io/cursorvers-edu/services.html"
echo "     - テストカード: 4242 4242 4242 4242"
echo "  3. 結果確認:"
echo "     - Supabase Dashboard → Table Editor → members"
echo "     - Google Sheets"
echo ""
