#!/bin/bash
# 日本語入力自動置換問題の対処スクリプト
# macOSのテキスト置換設定からcoinbase/bebased関連を削除

set -euo pipefail

echo "## 🔧 日本語入力自動置換問題の対処スクリプト"
echo ""

# テキスト置換設定の確認
echo "### 1. 現在のテキスト置換設定を確認"
echo ""

REPLACEMENTS=$(defaults read -g NSUserDictionaryReplacementItems 2>/dev/null || echo "")

if [ -z "$REPLACEMENTS" ]; then
  echo "✅ テキスト置換設定が見つかりません"
  echo "   問題は他の場所（IME辞書、エディタ設定等）にある可能性があります"
  exit 0
fi

echo "テキスト置換設定が見つかりました:"
echo ""

# coinbase/bebased関連の設定を確認
if echo "$REPLACEMENTS" | grep -qi -E "(coinbase|bebased)"; then
  echo "⚠️  coinbase/bebased関連の設定が見つかりました"
  echo ""
  echo "該当する設定:"
  echo "$REPLACEMENTS" | grep -i -E "(coinbase|bebased)" || echo "詳細を確認中..."
  echo ""
  echo "### 対処方法"
  echo ""
  echo "**オプション1: システム設定から手動削除（推奨）**"
  echo "1. システム設定 → キーボード → テキスト入力"
  echo "2. 「編集...」ボタンをクリック"
  echo "3. coinbase/bebased関連の行を削除"
  echo ""
  echo "**オプション2: すべてのテキスト置換設定を削除**"
  read -p "すべてのテキスト置換設定を削除しますか？ (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "削除中..."
    defaults delete -g NSUserDictionaryReplacementItems
    echo "✅ テキスト置換設定を削除しました"
    echo "   システム設定を再起動します..."
    killall System\ Settings 2>/dev/null || true
    echo "✅ 完了しました。アプリを再起動してください。"
  else
    echo "キャンセルしました。システム設定から手動で削除してください。"
  fi
else
  echo "✅ coinbase/bebased関連の設定は見つかりませんでした"
  echo ""
  echo "### 他の可能性"
  echo "1. IMEのユーザー辞書を確認"
  echo "   システム設定 → キーボード → 入力ソース → ユーザー辞書"
  echo ""
  echo "2. エディタ（Cursor/VS Code）のスニペット設定を確認"
  echo "   設定 → スニペット"
  echo ""
  echo "3. クリップボード管理アプリやマクロツールを確認"
  echo "   Karabiner、BetterTouchTool、TextExpander等"
fi

echo ""
echo "### 詳細ガイド"
echo "docs/JAPANESE_INPUT_AUTOCORRECT_FIX.md を参照してください"

