#!/bin/bash
# Manus連携スタック原因診断スクリプト

set -euo pipefail

echo "## 🔍 Manus連携スタック原因診断"
echo ""

# 1. GitHub Variables確認
echo "### 1. GitHub Variables確認"
echo ""
VARS=$(gh variable list 2>/dev/null || echo "")
DEV_MODE=""
MANUS_ENABLED=""
DEGRADED=""

if echo "$VARS" | grep -q "DEVELOPMENT_MODE"; then
    DEV_MODE=$(echo "$VARS" | grep "DEVELOPMENT_MODE" | awk '{print $2}')
    echo "  ✅ DEVELOPMENT_MODE: $DEV_MODE"
    if [ "$DEV_MODE" != "true" ]; then
        echo "     ⚠️ 警告: DEVELOPMENT_MODE が 'true' ではありません"
    fi
else
    echo "  ❌ DEVELOPMENT_MODE: 未設定"
    DEV_MODE=""
fi

if echo "$VARS" | grep -q "MANUS_ENABLED"; then
    MANUS_ENABLED=$(echo "$VARS" | grep "MANUS_ENABLED" | awk '{print $2}')
    echo "  ✅ MANUS_ENABLED: $MANUS_ENABLED"
    if [ "$MANUS_ENABLED" != "true" ]; then
        echo "     ⚠️ 警告: MANUS_ENABLED が 'true' ではありません"
    fi
else
    echo "  ❌ MANUS_ENABLED: 未設定"
    MANUS_ENABLED=""
fi

if echo "$VARS" | grep -q "MANUS_BASE_URL"; then
    MANUS_URL=$(echo "$VARS" | grep "MANUS_BASE_URL" | awk '{print $2}')
    echo "  ✅ MANUS_BASE_URL: $MANUS_URL"
else
    echo "  ❌ MANUS_BASE_URL: 未設定"
fi

if echo "$VARS" | grep -q "DEGRADED_MODE"; then
    DEGRADED=$(echo "$VARS" | grep "DEGRADED_MODE" | awk '{print $2}')
    echo "  ⚠️ DEGRADED_MODE: $DEGRADED"
    if [ "$DEGRADED" = "true" ]; then
        echo "     ⚠️ 警告: DEGRADED_MODE が 'true' です（Manus呼び出しがスキップされます）"
    fi
else
    echo "  ✅ DEGRADED_MODE: 未設定（正常）"
    DEGRADED=""
fi

echo ""

# 2. GitHub Secrets確認
echo "### 2. GitHub Secrets確認"
echo ""
SECRETS=$(gh secret list 2>/dev/null || echo "")
if echo "$SECRETS" | grep -q "MANUS_API_KEY"; then
    echo "  ✅ MANUS_API_KEY: 設定済み"
else
    echo "  ❌ MANUS_API_KEY: 未設定"
fi

if echo "$SECRETS" | grep -q "PROGRESS_WEBHOOK_URL"; then
    echo "  ✅ PROGRESS_WEBHOOK_URL: 設定済み"
else
    echo "  ❌ PROGRESS_WEBHOOK_URL: 未設定"
fi

echo ""

# 3. 必須ファイル確認
echo "### 3. 必須ファイル確認"
echo ""
if [ -f "orchestration/plan/current_plan.json" ]; then
    echo "  ✅ orchestration/plan/current_plan.json: 存在"
else
    echo "  ❌ orchestration/plan/current_plan.json: 不存在"
fi

if [ -f "orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt" ]; then
    echo "  ✅ orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt: 存在"
else
    echo "  ❌ orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt: 不存在"
fi

if [ -f "orchestration/plan/production/degraded.flag" ]; then
    echo "  ⚠️ orchestration/plan/production/degraded.flag: 存在（Manus呼び出しがスキップされます）"
else
    echo "  ✅ orchestration/plan/production/degraded.flag: 不存在（正常）"
fi

echo ""

# 4. ワークフロー実行条件チェック
echo "### 4. ワークフロー実行条件チェック"
echo ""
CONDITIONS_OK=true

if [ -z "$DEV_MODE" ] || [ "$DEV_MODE" != "true" ]; then
    echo "  ❌ 条件1: vars.DEVELOPMENT_MODE == 'true' → 失敗"
    CONDITIONS_OK=false
else
    echo "  ✅ 条件1: vars.DEVELOPMENT_MODE == 'true' → 成功"
fi

if [ -z "$MANUS_ENABLED" ] || [ "$MANUS_ENABLED" != "true" ]; then
    echo "  ❌ 条件2: vars.MANUS_ENABLED == 'true' → 失敗"
    CONDITIONS_OK=false
else
    echo "  ✅ 条件2: vars.MANUS_ENABLED == 'true' → 成功"
fi

if [ -f "orchestration/plan/production/degraded.flag" ] || [ "$DEGRADED" = "true" ] || [ -z "$MANUS_ENABLED" ] || [ "$MANUS_ENABLED" = "false" ]; then
    echo "  ❌ 条件3: steps.mode.outputs.mode != 'degraded' → 失敗（degradedモード）"
    CONDITIONS_OK=false
else
    echo "  ✅ 条件3: steps.mode.outputs.mode != 'degraded' → 成功"
fi

echo ""

# 5. 診断結果
echo "### 5. 診断結果"
echo ""
if [ "$CONDITIONS_OK" = "true" ]; then
    echo "  ✅ すべての条件が満たされています"
    echo "  📝 推奨: ワークフローを手動実行して確認してください"
    echo ""
    echo "  gh workflow run line-event.yml --ref main"
else
    echo "  ❌ 条件が満たされていません"
    echo "  📝 上記の警告を確認して、設定を修正してください"
fi

echo ""
echo "### 6. 次のステップ"
echo ""
echo "  1. 上記の警告を確認"
echo "  2. 設定を修正:"
echo "     gh variable set DEVELOPMENT_MODE --body \"true\""
echo "     gh variable set MANUS_ENABLED --body \"true\""
echo "  3. degraded.flagファイルが存在する場合は削除:"
echo "     rm orchestration/plan/production/degraded.flag"
echo "  4. ワークフローを手動実行:"
echo "     gh workflow run line-event.yml --ref main"

