#!/bin/bash
# GitHub Actionsワークフローのログを監視するスクリプト

set -euo pipefail

WORKFLOW_NAME="${1:-line-event.yml}"
POLL_INTERVAL="${2:-5}"

echo "## 🔍 GitHub Actionsワークフロー監視"
echo ""
echo "ワークフロー: $WORKFLOW_NAME"
echo "ポーリング間隔: ${POLL_INTERVAL}秒"
echo ""

# 最新の実行を取得
get_latest_run() {
    gh run list --workflow="$WORKFLOW_NAME" --limit 1 --json databaseId,status,conclusion,createdAt --jq '.[0]'
}

# ログを表示
show_log() {
    local run_id=$1
    echo ""
    echo "### 実行ログ (実行ID: $run_id)"
    echo ""
    gh run view "$run_id" --log 2>&1 | tail -50
}

# ステップサマリーを表示
show_steps() {
    local run_id=$1
    echo ""
    echo "### ステップ実行結果"
    echo ""
    gh run view "$run_id" --json jobs --jq '.jobs[0].steps[] | {name: .name, conclusion: .conclusion, status: .status}' | jq -s '.'
}

# メインループ
monitor_workflow() {
    local last_run_id=""
    
    while true; do
        local latest=$(get_latest_run)
        local current_run_id=$(echo "$latest" | jq -r '.databaseId')
        local status=$(echo "$latest" | jq -r '.status')
        local conclusion=$(echo "$latest" | jq -r '.conclusion // "unknown"')
        local created=$(echo "$latest" | jq -r '.createdAt')
        
        if [ "$current_run_id" != "$last_run_id" ]; then
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🆕 新しい実行を検出"
            echo "実行ID: $current_run_id"
            echo "状態: $status"
            echo "結論: $conclusion"
            echo "作成日時: $created"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            
            if [ "$status" = "in_progress" ] || [ "$status" = "queued" ]; then
                echo "⏳ 実行中... 完了を待機します"
                gh run watch "$current_run_id" --exit-status 2>&1 | tail -20
                echo ""
                echo "✅ 実行完了"
                show_steps "$current_run_id"
                show_log "$current_run_id"
            elif [ "$status" = "completed" ]; then
                echo "✅ 実行完了済み"
                show_steps "$current_run_id"
                show_log "$current_run_id"
            fi
            
            last_run_id="$current_run_id"
        else
            if [ "$status" = "in_progress" ] || [ "$status" = "queued" ]; then
                echo "⏳ 実行中... (${POLL_INTERVAL}秒後に再確認)"
            else
                echo "💤 実行待機中... (${POLL_INTERVAL}秒後に再確認)"
            fi
        fi
        
        sleep "$POLL_INTERVAL"
    done
}

# 使用方法の表示
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    echo "使用方法: $0 [ワークフロー名] [ポーリング間隔(秒)]"
    echo ""
    echo "例:"
    echo "  $0 line-event.yml 5     # line-event.ymlを5秒間隔で監視"
    echo "  $0 manus-progress.yml 10 # manus-progress.ymlを10秒間隔で監視"
    exit 0
fi

# Ctrl+Cで終了
trap 'echo ""; echo "監視を終了します"; exit 0' INT

monitor_workflow

