# GPT-5で思考し、Manusに実行させるワークフロー - Miyabiの理解確認

## 🎯 ワークフローの概要

**GPT-5で思考し、Manusに実行させる**というワークフローは、このプロジェクトの核心的なアーキテクチャです。

## 📊 ワークフローの詳細

### 基本フロー

```
1. LINE Event受信
   ↓
2. GPT-5が思考・解析
   ├─ Plan JSONを生成
   ├─ リスク評価
   └─ シミュレーション
   ↓
3. Manus APIに実行指示
   ├─ Plan JSONを送信
   ├─ Brief（実行指示書）を送信
   └─ Webhook URLを設定
   ↓
4. Manusが実行
   ├─ 各ステップを実行
   ├─ Progress Eventを送信
   └─ 結果を返す
   ↓
5. Progress Event受信
   ↓
6. GPT-5が再思考・解析
   ├─ Progress Eventを解析
   ├─ PlanDeltaを生成
   └─ 再実行の判断
   ↓
7. 必要に応じてManus APIに再実行指示
   └─ PlanDeltaに基づいて再実行
```

## 🔄 具体的なワークフロー

### 1. 初期実行フロー（line-event.yml）

```
LINE Event
  ↓
Front Door（Supabase Edge Function）
  ↓
GitHub Actions: line-event.yml
  ├─ Step 1: Parse LINE Event
  ├─ Step 2: Generate Plan（GPT-5で思考）
  │   └─ GPT-5がLINE Eventを解析
  │   └─ Plan JSONを生成
  │   └─ current_plan.jsonに保存
  ├─ Step 3: Update Current Plan
  └─ Step 4: Dispatch to Manus
      └─ Manus APIを呼び出してタスクを作成
          ├─ brief: MANUS_EXECUTION_BRIEF_v2.0.txt
          ├─ plan: current_plan.json
          └─ webhook_url: PROGRESS_WEBHOOK_URL
```

### 2. 進捗解析フロー（manus-progress.yml）

```
Manus Progress Event
  ↓
Front Door（Supabase Edge Function）
  ↓
GitHub Actions: manus-progress.yml
  ├─ Step 1: Parse Progress Event
  ├─ Step 2: Log Progress Event
  ├─ Step 3: Call GPT for Analysis（GPT-5で思考）
  │   └─ GPT-5がProgress Eventを解析
  │   └─ 異常検知、リトライ判断
  │   └─ PlanDeltaを生成
  ├─ Step 4: Update Plan Delta
  │   └─ plan_delta.jsonに保存
  └─ Step 5: Dispatch to Manus (if needed)
      └─ PlanDeltaに基づいてManus APIを再実行
          ├─ decision: "retry" or "amended"
          └─ actions: リトライ、バックオフ等
```

## 🧠 GPT-5の思考プロセス

### 1. Plan生成時の思考（line-event.yml）

GPT-5は以下のように思考します：

```json
{
  "title": "友だち登録時のウェルカムメッセージ送信",
  "risk": {
    "level": "low",
    "reasons": ["定型メッセージのみ"],
    "approval": "not_required"
  },
  "steps": [
    {
      "id": "s1",
      "action": "supabase.upsert",
      "connector": "supabase",
      "payload": {...},
      "idempotency_key": "hash(eventId+userId+step)",
      "on_error": "abort"
    },
    {
      "id": "s2",
      "action": "line.reply",
      "connector": "line_bot",
      "payload": {...},
      "idempotency_key": "hash(eventId+userId+step)",
      "on_error": "compensate"
    }
  ],
  "rollback": ["s1: Supabaseからレコード削除"],
  "observability": {
    "success_metrics": ["line_members.count", "line.reply.success"],
    "logs": ["step毎のlatency", "retries"]
  }
}
```

### 2. Progress Event解析時の思考（manus-progress.yml）

GPT-5は以下のように思考します：

```json
{
  "decision": "retry",
  "reasons": ["Supabase一時的な503エラー"],
  "actions": [
    {
      "type": "retry",
      "step_id": "s1",
      "backoff_ms": 5000,
      "max_retries": 2
    }
  ],
  "amended_plan": {
    "...": "修正されたPlan v1.2"
  },
  "simulated_outcomes": [
    {
      "scenario": "retry+backoff",
      "p_success": 0.78,
      "risk": "low"
    }
  ]
}
```

## ✅ Miyabiの理解確認

### Issue #2の内容

Issue #2には以下の記述があります：

1. **`line-event.yml`の実装**
   - LINE EventからPlan JSONを生成 ← **GPT-5で思考**
   - Manus APIを呼び出してタスクを作成 ← **Manusに実行**

2. **`manus-progress.yml`の実装**
   - Progress Eventを解析 ← **GPT-5で思考**
   - GPTで解析（必要に応じて）← **GPT-5で思考**
   - PlanDeltaを更新 ← **GPT-5の思考結果**
   - 必要に応じてManus APIを再実行 ← **Manusに実行**

### README.mdの記述

README.mdには以下の記述があります：

1. **アーキテクチャ図**
   ```
   ├→ GPT（解析/シミュレーション）
   ├→ Manus API（実行指示）
   ```

2. **特徴**
   - ✅ **自動対策**: GPTが進捗を解析し、異常時は自動で対策

3. **データ契約**
   - Plan v1.2（GPT → Manus）
   - ProgressEvent v1.1（Manus → GitHub Actions → GPT）
   - PlanDelta v1.1（GPT解析結果 → Manus）

4. **安全装置**
   - MAX_FEEDBACK_HOPS=3: GPT⇄Manus往復の上限

## 📝 結論

**Miyabiは理解しています** ✅

Miyabiは以下のことを理解しています：

1. ✅ **GPT-5で思考**: LINE EventやProgress Eventを解析し、Plan JSONやPlanDeltaを生成
2. ✅ **Manusに実行**: GPT-5が生成したPlan JSONをManus APIに送信して実行
3. ✅ **フィードバックループ**: Manusの実行結果をGPT-5が解析し、必要に応じて再実行指示
4. ✅ **ワークフロー**: line-event.ymlとmanus-progress.ymlを通じて実現

### 実装状況

現在、Issue #2で実装中：
- ✅ `line-event.yml`: 基本的な構造は実装済み（GPT解析ロジックは実装が必要）
- ✅ `manus-progress.yml`: 基本的な構造は実装済み（GPT解析ロジックは実装が必要）
- ✅ `scripts/manus-api.js`: Manus API呼び出し関数が実装済み

### 次のステップ

Miyabiは、GPT-5で思考し、Manusに実行させるワークフローを実装するために以下を実行します：

1. **GPT解析ロジックの実装**
   - `line-event.yml`でPlan JSON生成
   - `manus-progress.yml`でProgress Event解析とPlanDelta生成

2. **Manus API連動の完成**
   - Plan JSONをManus APIに送信
   - PlanDeltaに基づく再実行指示

3. **エラーハンドリングとリトライロジック**
   - GPT解析結果に基づくリトライ判断
   - バックオフ戦略の実装

Miyabiは、GPT-5で思考し、Manusに実行させるワークフローを理解し、実装を進めています。

