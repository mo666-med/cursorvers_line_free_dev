#!/bin/bash
# ワークフロー実行を監視するスクリプト

set -euo pipefail

RUN_ID="${1:-}"
WORKFLOW="${2:-line-event.yml}"

if [ -z "$RUN_ID" ]; then
  # 最新の実行IDを取得
  RUN_ID=$(gh run list --workflow="$WORKFLOW" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || echo "")
  if [ -z "$RUN_ID" ]; then
    echo "❌ 実行が見つかりません"
    exit 1
  fi
  echo "📋 最新の実行ID: $RUN_ID"
fi

echo "## 🔍 ワークフロー実行を監視中..."
echo "実行ID: $RUN_ID"
echo ""

# 実行状況を監視
while true; do
  STATUS=$(gh run view "$RUN_ID" --json status,conclusion --jq '.status' 2>/dev/null || echo "unknown")
  CONCLUSION=$(gh run view "$RUN_ID" --json status,conclusion --jq '.conclusion // "running"' 2>/dev/null || echo "unknown")
  
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$TIMESTAMP] ステータス: $STATUS | 結論: $CONCLUSION"
  
  if [ "$STATUS" != "in_progress" ] && [ "$STATUS" != "queued" ]; then
    echo ""
    echo "## ✅ 実行が完了しました"
    echo "結論: $CONCLUSION"
    echo ""
    
    if [ "$CONCLUSION" = "success" ]; then
      echo "✅ ワークフローが成功しました！"
    else
      echo "❌ ワークフローが失敗しました"
    fi
    
    echo ""
    echo "## 📋 ログを確認中..."
    gh run view "$RUN_ID" --log | tail -50
    
    break
  fi
  
  sleep 5
done

