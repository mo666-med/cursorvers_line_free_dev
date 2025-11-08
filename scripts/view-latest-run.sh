#!/bin/bash
# 最新のGitHub Actions実行を表示するスクリプト

set -euo pipefail

WORKFLOW="${1:-line-event.yml}"

echo "## 🔍 最新のワークフロー実行を取得中..."

# 最新の実行IDを取得
LATEST_RUN=$(gh run list --workflow="$WORKFLOW" --limit 1 --json databaseId,status,conclusion,displayTitle,createdAt --jq '.[0].databaseId' 2>/dev/null || echo "")

if [ -z "$LATEST_RUN" ]; then
  echo "❌ ワークフロー '$WORKFLOW' の実行が見つかりません"
  echo ""
  echo "利用可能なワークフロー:"
  gh workflow list 2>/dev/null || echo "ワークフロー一覧の取得に失敗しました"
  exit 1
fi

echo "📋 最新の実行ID: $LATEST_RUN"
echo ""

# 実行の詳細を表示
echo "## 📊 実行詳細"
gh run view "$LATEST_RUN" --log

