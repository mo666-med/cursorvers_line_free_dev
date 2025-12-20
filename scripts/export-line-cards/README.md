# Export Line Cards

Obsidian VaultからLINEカードを抽出してSupabaseに同期するスクリプト。

## 概要

`#cv_line` タグが付いた行をObsidian Vaultから抽出し、Supabaseの `line_cards` テーブルに同期します。

## 使い方

### ローカル実行

```bash
# 通常実行
deno task export

# ドライラン（DBへの書き込みなし）
deno task export --dry-run

# ヘルプ表示
deno task export --help
```

### 環境変数

| 変数名 | 必須 | 説明 | デフォルト |
|--------|------|------|----------|
| `VAULT_PATH` | No | Obsidian Vaultのパス | `/Users/masayuki/Obsidian Pro Kit for market` |
| `SUPABASE_URL` | Yes* | SupabaseプロジェクトURL | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Supabaseサービスロールキー | - |
| `BATCH_SIZE` | No | DB挿入時のバッチサイズ | `50` |

*ドライランモード時は不要

### GitHub Actions

毎日06:00 JSTに自動実行されます。

```bash
# 手動実行
gh workflow run "Sync Line Cards from Obsidian"

# ドライランで手動実行
gh workflow run "Sync Line Cards from Obsidian" -f dry_run=true
```

## ファイル構成

```
export-line-cards/
├── src/
│   ├── main.ts           # エントリーポイント
│   ├── extractor.ts      # Vault抽出ロジック
│   ├── supabase-client.ts # DB操作（リトライ付き）
│   └── types.ts          # 型定義
├── test/
│   ├── extractor_test.ts
│   └── supabase-client_test.ts
└── deno.json             # Deno設定
```

## タグ形式

Obsidianで以下の形式でタグを付けると抽出されます：

```markdown
- これはLINEで配信したい内容です #cv_line #tech
- 税務に関する情報 #cv_line #tax
- カテゴリなしの一般情報 #cv_line
```

### 対応カテゴリ

| タグ | カテゴリ | 説明 |
|-----|---------|------|
| `#ai_gov` | ai_gov | 医療AI/ヘルスケアDX |
| `#tax` | tax | 税務/節税 |
| `#law` | law | 法務/契約 |
| `#biz` | biz | 事業戦略/経営 |
| `#career` | career | キャリア/働き方 |
| `#asset` | asset | 資産形成/投資 |
| `#tech` | tech | 開発/プログラミング |
| `#crypto` | crypto | 暗号資産/Web3 |
| `#thought` | thought | 考察/意見 |
| `#life` | life | 日常/雑記 |
| (なし) | general | その他 |

## テスト実行

```bash
cd scripts/export-line-cards
deno test --allow-read --allow-write --allow-env --no-lock test/
```

## 重複防止

コンテンツハッシュ（SHA-256）により、同じ内容のカードは重複登録されません。

ハッシュ計算式:
```
hash = SHA256(sourcePath + ":" + sourceLine + ":" + body)
```

## トラブルシューティング

### カードが抽出されない

1. `#cv_line` タグが正しく付いているか確認
2. 本文が10文字以上あるか確認
3. `.obsidian/` や `node_modules/` 内のファイルは除外されます

### DB接続エラー

- 自動リトライ（最大3回）が実行されます
- 環境変数が正しく設定されているか確認してください

### GitHub Actions が失敗

```bash
# 実行ログを確認
gh run list --workflow "Sync Line Cards from Obsidian" --limit 3
gh run view <run-id> --log
```
