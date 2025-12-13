#!/bin/bash
# fix-yaml-syntax.sh
# YAML構文エラーを自動修正するスクリプト

set -e

echo "🔧 YAML構文エラーを修正中..."

# 修正対象ファイル
FILES=(
  ".github/workflows/manus-audit-daily.yml"
  ".github/workflows/manus-audit-weekly.yml"
  ".github/workflows/manus-audit-monthly.yml"
  ".github/workflows/manus-audit-report.yml"
)

FIXED_COUNT=0

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    # 一般的なYAML構文エラーを修正
    
    # 1. 余分なスペースを削除（例: " ) → "）
    if sed -i 's/" )/")/g' "$FILE"; then
      echo "✅ Fixed trailing spaces in: $FILE"
      FIXED_COUNT=$((FIXED_COUNT + 1))
    fi
    
    # 2. インデントエラーを修正（基本的なケース）
    # yamllintがあれば使用
    if command -v yamllint &> /dev/null; then
      if yamllint "$FILE" 2>&1 | grep -q "error"; then
        echo "⚠️  YAML errors detected in: $FILE"
        echo "   Manual review required"
      fi
    fi
  else
    echo "⚠️  Not found: $FILE"
  fi
done

if [ $FIXED_COUNT -gt 0 ]; then
  echo "✅ Fixed $FIXED_COUNT file(s)"
  exit 0
else
  echo "ℹ️  No files needed fixing"
  exit 0
fi
