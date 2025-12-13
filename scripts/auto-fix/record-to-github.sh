#!/bin/bash
# record-to-github.sh
# 監査結果をGitHubに自動記録するスクリプト

set -e

# 引数チェック
if [ $# -lt 2 ]; then
  echo "Usage: $0 <log_type> <content>"
  echo "log_type: audit|error|fix|snapshot"
  exit 1
fi

LOG_TYPE=$1
CONTENT=$2
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
DATE=$(date +%Y-%m-%d)

# ログディレクトリ
case $LOG_TYPE in
  audit)
    LOG_DIR="docs/logs/audit"
    LOG_FILE="${LOG_DIR}/daily-${DATE}.md"
    ;;
  error)
    LOG_DIR="docs/logs/errors"
    LOG_FILE="${LOG_DIR}/error-${TIMESTAMP}.json"
    ;;
  fix)
    LOG_DIR="docs/logs/fixes"
    LOG_FILE="${LOG_DIR}/fix-${TIMESTAMP}.md"
    ;;
  snapshot)
    LOG_DIR="docs/logs/snapshots"
    LOG_FILE="${LOG_DIR}/state-${DATE}.json"
    ;;
  *)
    echo "Invalid log_type: $LOG_TYPE"
    exit 1
    ;;
esac

# ディレクトリ作成
mkdir -p "$LOG_DIR"

# ログファイル作成
echo "$CONTENT" > "$LOG_FILE"

# Git設定
git config user.name "Manus Automation"
git config user.email "automation@manus.im"

# コミット
git add "$LOG_FILE"
git commit -m "chore: record ${LOG_TYPE} log ${TIMESTAMP}" || echo "No changes to commit"

echo "✅ Logged to: $LOG_FILE"
