# Manus API連動実装計画

## 現状分析

### 実装済み
- ✅ 基本的なワークフロー構造（`manus-progress.yml`, `line-event.yml`）
- ✅ Front Door（`functions/relay/index.ts`）でManus Progress Eventの受信
- ✅ MANUS_EXECUTION_BRIEF定義
- ✅ Plan JSONの構造定義

### 未実装
- ❌ Manus APIへの実際の呼び出し（ワークフロー内）
- ❌ GPT解析ロジックの実装
- ❌ PlanDelta更新ロジック
- ❌ GitHub Secretsの設定

## 実装が必要な機能

### 1. Manus API呼び出し機能

#### 1.1 タスク作成（Plan実行）
```typescript
POST https://api.manus.im/v1/tasks
Headers:
  Authorization: Bearer ${MANUS_API_KEY}
  Content-Type: application/json
Body:
  {
    "brief": "...", // MANUS_EXECUTION_BRIEF
    "plan": {...},  // Plan JSON
    "webhook_url": "${PROGRESS_WEBHOOK_URL}"
  }
```

#### 1.2 タスク状態確認
```typescript
GET https://api.manus.im/v1/tasks/${task_id}
Headers:
  Authorization: Bearer ${MANUS_API_KEY}
```

#### 1.3 タスクキャンセル
```typescript
POST https://api.manus.im/v1/tasks/${task_id}/cancel
Headers:
  Authorization: Bearer ${MANUS_API_KEY}
```

### 2. GitHub Actionsワークフロー実装

#### 2.1 `line-event.yml`の実装
- LINE EventからPlan JSONを生成
- Manus APIを呼び出してタスクを作成
- 結果をログに記録

#### 2.2 `manus-progress.yml`の実装
- Progress Eventを解析
- GPTで解析（必要に応じて）
- PlanDeltaを更新
- 必要に応じてManus APIを再実行

### 3. 必要なシークレットと変数

```bash
# GitHub Secrets
gh secret set MANUS_API_KEY --body "your-manus-api-key"
gh secret set PROGRESS_WEBHOOK_URL --body "https://your-domain.jp/functions/relay"
gh secret set LLM_ENDPOINT --body "https://api.openai.com/v1/chat/completions"
gh secret set LLM_API_KEY --body "sk-..."

# GitHub Variables
gh variable set MANUS_BASE_URL --body "https://api.manus.im"
gh variable set VERIFIED_DOMAIN --body "https://your-verified-domain.jp"
```

## 実装ステップ

### Phase 1: 基本実装
1. Manus API呼び出し関数の作成
2. `line-event.yml`の実装
3. `manus-progress.yml`の実装

### Phase 2: GPT解析統合
1. GPT API呼び出し関数の作成
2. Progress Event解析ロジック
3. PlanDelta生成ロジック

### Phase 3: エラーハンドリングとリトライ
1. エラーハンドリングの実装
2. リトライロジック
3. ログと監視

## 次のアクション

1. **MiyabiでIssueを作成**して実装を依頼
2. **GitHub Secretsを設定**
3. **実装を進める**

