# Manus API 検証ガイド

## 概要

Manus/Supabase連携の実装が完了しました。このガイドでは、実装の検証方法とテスト手順を説明します。

## 実装内容

### 1. Manus API Client (`scripts/lib/manus-api.js`)

共通クライアントライブラリを実装：
- APIキー/ベースURL解決
- prompt生成（brief + plan JSON）
- POST/GET/DELETE メソッドのラップ

### 2. CLI (`scripts/manus-api.js`)

コマンドラインインターフェース：
- `create`: タスク作成（`--webhook`オプション対応）
- `get`: タスク状態取得
- `cancel`: タスクキャンセル

### 3. ワークフロー統合

- `line-event.yml`: Manus API呼び出しに`--webhook`フラグを追加
- `manus-progress.yml`: Progress Event処理

## 検証方法

### 方法1: GitHub Actionsで実行（推奨）

**前提条件**:
- Secretsが設定済み（`MANUS_API_KEY`, `PROGRESS_WEBHOOK_URL`）
- Variablesが設定済み（`MANUS_BASE_URL`, `SUPABASE_URL`等）

**実行手順**:

```bash
# 1. ワークフローを手動実行
gh workflow run line-event.yml --ref main

# 2. 実行状況を確認
gh run list --workflow=line-event.yml --limit 5

# 3. 最新の実行IDを取得してログを確認
LATEST_RUN=$(gh run list --workflow=line-event.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view "$LATEST_RUN" --log

# または、ヘルパースクリプトを使用
./scripts/view-latest-run.sh line-event.yml

# 4. Step Summaryを確認
# GitHub UIで「Actions」タブ → 実行を選択 → 「Summary」セクションを確認
```

**確認ポイント**:
- ✅ `🚀 Calling Manus API to create task...` が表示される
- ✅ Manus API呼び出しが成功（`task_id`が返される）
- ✅ Supabaseへのupsertが成功
- ✅ Step SummaryにManus task IDが記録される

### 方法2: ローカルでテスト

**前提条件**:
- `.env`ファイルに環境変数が設定されている
- Node.js 20以上がインストールされている

**実行手順**:

```bash
# 1. 環境変数を読み込み
source .env

# 2. Manus APIを呼び出し
node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
  orchestration/plan/current_plan.json \
  --webhook "$PROGRESS_WEBHOOK_URL"

# 3. レスポンスを確認
# {
#   "status": "ok",
#   "action": "create",
#   "result": {
#     "task_id": "...",
#     ...
#   }
# }
```

**確認ポイント**:
- ✅ `task_id`が返される
- ✅ エラーメッセージが表示されない

### 方法3: テスト実行

```bash
# Manus関連のテストを実行
npm test -- --test-name-pattern=manus

# すべてのテストを実行
npm test
```

## Progress Eventの検証

### 1. Manus Progress Eventの受信確認

`manus-progress.yml`が正常に動作するか確認：

```bash
# 1. サンプルProgress Eventを作成
cat > tmp/test-progress.json << 'EOF'
{
  "task_id": "test-task-123",
  "decision": "proceed",
  "plan_variant": "production",
  "manus_points_consumed": 10.5,
  "metadata": {
    "reason": "test"
  }
}
EOF

# 2. repository_dispatchで実行
gh workflow run manus-progress.yml \
  --ref main \
  -f event_type=manus_progress \
  -f client_payload=@tmp/test-progress.json
```

### 2. Supabaseへの永続化確認

```bash
# Supabaseに接続して確認
supabase db connect

# progress_eventsテーブルを確認
SELECT * FROM progress_events 
WHERE task_id = 'test-task-123' 
ORDER BY created_at DESC 
LIMIT 5;
```

## トラブルシューティング

### エラー: `MANUS_API_KEY is not configured`

**原因**: 環境変数が設定されていない

**解決方法**:
```bash
# GitHub Secretsを確認
gh secret list

# ローカルで設定
export MANUS_API_KEY="your-api-key"
```

### エラー: `Manus API POST /v1/tasks failed (401)`

**原因**: APIキーが無効または形式が間違っている

**解決方法**:
- APIキーを再確認
- `MANUS_BASE_URL`が正しいか確認（デフォルト: `https://api.manus.ai`）

### エラー: `Failed to create Manus task`

**原因**: API呼び出しが失敗

**解決方法**:
1. ログを確認してエラーメッセージを特定
2. `scripts/manus-api.js`の`--webhook`フラグが正しく使用されているか確認
3. `PROGRESS_WEBHOOK_URL`が有効か確認

## 実装チェックリスト

- [x] `scripts/lib/manus-api.js` の実装完了
- [x] `scripts/manus-api.js` CLI実装完了
- [x] `line-event.yml` で`--webhook`フラグを使用
- [x] `manus-progress.yml` の実装確認
- [ ] GitHub Actionsでの実行検証
- [ ] Progress Eventの疎通確認
- [ ] Supabaseへの永続化確認

## 関連ドキュメント

- `docs/MANUS_API.md`: Manus API統合の詳細
- `docs/MANUS_ENV_SETUP.md`: 環境変数設定ガイド
- `docs/CURSOR_MANUS_REMOTE_CONTROL.md`: Cursorからの遠隔操作
- `docs/MANUS_API_JSON_FORMAT.md`: APIリクエスト形式

## 次のステップ

1. **GitHub Actionsで実行検証**
   - `gh workflow run line-event.yml`を実行
   - ログとStep Summaryを確認

2. **Progress Eventの疎通確認**
   - `manus-progress.yml`を実行
   - Supabaseへの永続化を確認

3. **エンドツーエンドテスト**
   - LINE Event → Manus API → Progress Event → Supabase のフローを確認

