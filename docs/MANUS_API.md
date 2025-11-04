# Manus API連動ガイド

## 概要

GitHub ActionsワークフローからManus APIを呼び出して、LINE友だち登録システムと連動させる方法を説明します。

## アーキテクチャ

### 開発段階（GPT-5/Manus使用）

```
LINE Event
  ↓
Front Door（Supabase Edge Function）
  ↓
GitHub Actions: line-event.yml
  ├─ GPT-5で思考・解析
  ├─ Plan JSONを生成
  └─ Manus APIに実行指示（テスト）
  ↓
Manus Progress Event
  ↓
GitHub Actions: manus-progress.yml
  ├─ GPT-5で再思考・解析
  ├─ PlanDeltaを生成
  └─ 必要に応じてManus APIを再実行
```

### 本番環境（確定されたPlan JSON使用）

```
LINE Event
  ↓
Front Door（Supabase Edge Function）
  ↓
GitHub Actions: line-event.yml
  ├─ 確定されたPlan JSONを読み込み
  ├─ Supabaseにデータ保存
  └─ LINE APIでメッセージ送信
```

**PCやManusが起動していなくても自動実行されます。**

## セットアップ

### 1. GitHub Secrets設定

```bash
# Manus APIキー
gh secret set MANUS_API_KEY --body "your-manus-api-key"

# Progress Webhook URL
gh secret set PROGRESS_WEBHOOK_URL --body "https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay"
```

### 2. GitHub Variables設定

```bash
# Manus Base URL
gh variable set MANUS_BASE_URL --body "https://api.manus.im"

# 開発段階/本番環境の切り替え
gh variable set DEVELOPMENT_MODE --body "true"  # 開発段階
gh variable set MANUS_ENABLED --body "true"      # 開発段階
```

## 実装

### 1. Manus API呼び出し関数

`scripts/manus-api.js` を作成：

```javascript
// Manus API呼び出し例
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

### 2. line-event.ymlの実装

```yaml
- name: Generate Plan (Development Only)
  if: vars.DEVELOPMENT_MODE == 'true'
  run: |
    # GPT-5でPlan JSONを生成
    node scripts/generate-plan.js

- name: Load Predefined Plan (Production)
  if: vars.DEVELOPMENT_MODE != 'true'
  run: |
    # 確定されたPlan JSONを使用
    cp orchestration/plan/production/current_plan.json \
       orchestration/plan/current_plan.json

- name: Dispatch to Manus (Development Only)
  if: vars.DEVELOPMENT_MODE == 'true' && vars.MANUS_ENABLED == 'true'
  run: |
    node scripts/manus-api.js create \
      orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt \
      orchestration/plan/current_plan.json \
      --webhook "$PROGRESS_WEBHOOK_URL"
```

### 3. manus-progress.ymlの実装

```yaml
- name: Call GPT for Analysis (Development Only)
  if: vars.DEVELOPMENT_MODE == 'true'
  run: |
    # GPT-5でProgress Eventを解析
    node scripts/analyze-progress.js

- name: Update Plan Delta (Development Only)
  if: vars.DEVELOPMENT_MODE == 'true'
  run: |
    # PlanDeltaを更新
    node scripts/update-plan-delta.js

- name: Dispatch to Manus (if needed)
  if: vars.DEVELOPMENT_MODE == 'true' && vars.MANUS_ENABLED == 'true'
  run: |
    # PlanDeltaに基づいてManus APIを再実行
    node scripts/manus-api.js retry
```

## 使用方法

### 開発段階でのテスト

```bash
# 開発モードを有効化
gh variable set DEVELOPMENT_MODE --body "true"
gh variable set MANUS_ENABLED --body "true"

# LINE Eventをシミュレート
curl -X POST https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay \
  -H "Content-Type: application/json" \
  -d '{"events": [{"type": "follow", ...}]}'
```

### 本番環境への移行

```bash
# 開発モードを無効化
gh variable set DEVELOPMENT_MODE --body "false"
gh variable set MANUS_ENABLED --body "false"

# 確定されたPlan JSONを本番環境用にコピー
cp orchestration/plan/development/current_plan.json \
   orchestration/plan/production/current_plan.json
```

## データ契約

### Plan v1.2（開発段階：GPT → Manus、本番環境：確定されたPlan JSONを使用）

詳細は `README.md` の「データ契約」セクションを参照してください。

### ProgressEvent v1.1（開発段階のみ）

詳細は `README.md` の「データ契約」セクションを参照してください。

### PlanDelta v1.1（開発段階のみ）

詳細は `README.md` の「データ契約」セクションを参照してください。

## 参考資料

- `orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt`: Manus実行指示書
- `orchestration/plan/current_plan.json`: Plan JSONの例
- `README.md`: プロジェクト全体の説明
