#!/bin/bash
# fix-auth-headers.sh
# 認証ヘッダーを自動修正するスクリプト

set -e

echo "🔧 認証ヘッダーを修正中..."

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
    # X-API-Key を Authorization: Bearer に置換
    if grep -q "X-API-Key" "$FILE"; then
      sed -i 's/-H "X-API-Key: \${MANUS_AUDIT_API_KEY}"/-H "Authorization: Bearer ${MANUS_AUDIT_API_KEY}"/g' "$FILE"
      echo "✅ Fixed: $FILE"
      FIXED_COUNT=$((FIXED_COUNT + 1))
    else
      echo "⏭️  Skipped: $FILE (already fixed or not applicable)"
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
