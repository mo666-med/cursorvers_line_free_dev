#!/bin/bash
# miyabi-progress.sh
# Miyabiの進捗状況を確認するスクリプト

echo "📊 Miyabi進捗レポート - $(date)"
echo "=================================="

echo "\n🔍 Issue Status:"
gh issue list --json number,title,labels,state --jq '.[] | select(.state == "OPEN") | "  #\(.number): \(.title)\n    Labels: \(.labels | map(.name) | join(", "))"'

echo "\n🚀 Workflow Status:"
gh run list --workflow="autonomous-agent.yml" --limit 5 --json event,status,conclusion,createdAt --jq '.[] | select(.event == "issues") | "  [\(.status)] \(.createdAt)"'

echo "\n📝 Pull Requests:"
gh pr list --json number,title,state --jq '.[] | "  #\(.number): \(.title) [\(.state)]"'

echo "\n✨ Miyabi Status:"
npx miyabi status --json 2>/dev/null || echo "  Status unavailable"

