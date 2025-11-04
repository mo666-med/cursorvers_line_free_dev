# GitHub ActionsからManus APIを呼び出す方法

## 実装完了

### 1. Manus API Clientスクリプト
- `scripts/manus-api.js`: Manus APIを呼び出すNode.jsスクリプト
- タスク作成、状態取得、キャンセル機能を実装

### 2. ワークフロー実装
- `line-event.yml`: LINE EventからManus APIを呼び出してタスクを作成
- `manus-progress.yml`: Progress Eventに基づいてManus APIを再実行（必要に応じて）

## 使用方法

### GitHub ActionsからManus APIを呼び出す

#### 1. 必要なSecretsとVariablesを設定

```bash
# GitHub Secrets
gh secret set MANUS_API_KEY --body "your-manus-api-key"
gh secret set PROGRESS_WEBHOOK_URL --body "https://your-domain.jp/functions/relay"

# GitHub Variables
gh variable set MANUS_BASE_URL --body "https://api.manus.im"
```

#### 2. ワークフロー内での使用例

```yaml
- name: Call Manus API
  env:
    MANUS_API_KEY: ${{ secrets.MANUS_API_KEY }}
    MANUS_BASE_URL: ${{ vars.MANUS_BASE_URL }}
    PROGRESS_WEBHOOK_URL: ${{ secrets.PROGRESS_WEBHOOK_URL }}
  run: |
    node scripts/manus-api.js create \
      orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt \
      orchestration/plan/current_plan.json \
      --webhook "${{ secrets.PROGRESS_WEBHOOK_URL }}"
```

### Manus API Clientスクリプトの使い方

#### タスクを作成
```bash
export MANUS_API_KEY="your-api-key"
export PROGRESS_WEBHOOK_URL="https://your-webhook-url"
node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt \
  orchestration/plan/current_plan.json \
  --webhook "$PROGRESS_WEBHOOK_URL"
```

#### タスクの状態を取得
```bash
export MANUS_API_KEY="your-api-key"
node scripts/manus-api.js get <task-id>
```

#### タスクをキャンセル
```bash
export MANUS_API_KEY="your-api-key"
node scripts/manus-api.js cancel <task-id>
```

## 実装の流れ

### LINE Event Handler (`line-event.yml`)

1. LINE Eventを受信
2. Plan JSONを生成（または既存の`current_plan.json`を使用）
3. Manus APIを呼び出してタスクを作成
4. 結果をログに記録

### Manus Progress Handler (`manus-progress.yml`)

1. Progress Eventを受信
2. ログに記録
3. GPTで解析（オプション）
4. PlanDeltaを更新
5. 必要に応じてManus APIを再実行

## エラーハンドリング

- `MANUS_API_KEY`が設定されていない場合は、エラーを出さずにスキップ
- API呼び出し失敗時は、エラーメッセージを出力してexit 1
- リトライロジックは今後の実装予定

## テスト方法

### ローカルでテスト

```bash
# 環境変数を設定
export MANUS_API_KEY="your-api-key"
export PROGRESS_WEBHOOK_URL="https://your-webhook-url"
export MANUS_BASE_URL="https://api.manus.im"

# タスクを作成（--webhook フラグ推奨）
node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt \
  orchestration/plan/current_plan.json \
  --webhook "$PROGRESS_WEBHOOK_URL"
```

### GitHub Actionsでテスト

```bash
# ワークフローを手動で実行
gh workflow run line-event.yml

# 実行状況を確認
gh run list --workflow=line-event.yml
```

## 参考資料

- Manus API Documentation: https://docs.manus.im
- GitHub Actions Documentation: https://docs.github.com/en/actions

