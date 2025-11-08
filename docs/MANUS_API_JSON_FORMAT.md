# Manus APIへのJSON送信形式

## 📋 概要

Manus APIにタスクを作成する際のJSON形式を説明します。

## 🚀 APIリクエスト形式

### エンドポイント

```
POST https://api.manus.ai/v1/tasks
```

### リクエストヘッダー

```json
{
  "API_KEY": "${MANUS_API_KEY}",
  "Content-Type": "application/json",
  "User-Agent": "Miyabi-Agent"
}
```

**重要**: 
- `Authorization: Bearer`ではなく、`API_KEY`ヘッダーを使用します
- APIキーは単純な文字列形式（JWT形式ではない）

### リクエストボディ（JSON形式）

```json
{
  "prompt": "【MANUS_EXECUTION_BRIEF: COST-AWARE v3.1】\n\n役割：\n- あなたは実装担当（Executor）。以下のPlan JSONに沿って「必要最小限の外部連携」のみ実行する。\n...\n\nPlan JSON:\n{\n  \"title\": \"友だち登録時のウェルカムメッセージ送信\",\n  \"risk\": {...},\n  \"steps\": [...]\n}",
  "webhook_url": "https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay"
}
```

**重要**: 
- `brief`と`plan`ではなく、`prompt`フィールドを使用します
- `brief`と`plan`を統合して`prompt`に設定します

## 📋 フィールドの説明

### `prompt` (文字列、必須)

Manus実行指示書（brief）とPlan JSONを統合した文字列を送信します。

**形式**: プレーンテキスト
**内容**: 
- `brief`の内容
- `\n\nPlan JSON:\n`の後に`plan`をJSON文字列として追加

**例**: 
```javascript
const prompt = `${brief}\n\nPlan JSON:\n${JSON.stringify(plan, null, 2)}`;
```

### `webhook_url` (文字列、オプション)

進捗通知を受け取るWebhook URLを指定します。

**形式**: URL文字列
**例**: `https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay`

## 📋 Plan JSON v1.2形式

### 基本構造

```json
{
  "title": "タスクのタイトル",
  "risk": {
    "level": "low" | "medium" | "high",
    "reasons": ["理由1", "理由2"],
    "approval": "not_required" | "required"
  },
  "steps": [
    {
      "id": "ステップID",
      "action": "アクション名",
      "connector": "コネクター名",
      "payload": {},
      "idempotency_key": "冪等性キー",
      "on_error": "abort" | "continue" | "compensate"
    }
  ],
  "rollback": ["ロールバック手順"],
  "observability": {
    "success_metrics": ["成功指標"],
    "logs": ["ログ項目"]
  }
}
```

### ステップ（Step）の形式

```json
{
  "id": "s1",
  "action": "line.get_profile",
  "connector": "line_bot",
  "payload": {
    "user_id": "{{LINE_USER_ID}}"
  },
  "idempotency_key": "{{EVENT_ID}}-s1",
  "on_error": "abort"
}
```

**フィールド説明**:
- `id`: ステップの一意のID（必須）
- `action`: 実行するアクション名（必須）
- `connector`: 使用するコネクター名（必須）
- `payload`: アクションに渡すパラメータ（必須）
- `idempotency_key`: 冪等性を保証するキー（必須）
- `on_error`: エラー時の動作（必須）

## 📋 使用例

### コードからの使用例

```javascript
const brief = fs.readFileSync('orchestration/MANUS_EXECUTION_BRIEF_costaware.txt', 'utf8');
const plan = JSON.parse(fs.readFileSync('orchestration/plan/current_plan.json', 'utf8'));

// briefとplanを統合してpromptフィールドに設定
const prompt = `${brief}\n\nPlan JSON:\n${JSON.stringify(plan, null, 2)}`;

const payload = {
  prompt: prompt,
  webhook_url: webhookUrl || PROGRESS_WEBHOOK_URL
};
```

### CLIからの使用例

```bash
node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
  orchestration/plan/current_plan.json \
  --webhook "https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay"
```

### MCPからの使用例

```javascript
// .cursor/mcp-servers/manus-api.jsから
const brief = fs.readFileSync(briefFile, 'utf8');
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));

const result = await createManusTask({
  brief,
  plan,
  webhookUrl
});
```

## 📋 レスポンス形式

### 成功時（200 OK）

```json
{
  "task_id": "task-123456",
  "status": "created",
  "created_at": "2025-11-01T12:34:56Z"
}
```

### エラー時（400/401/500）

```json
{
  "code": 16,
  "message": "invalid token: token is malformed: token contains an invalid number of segments",
  "details": []
}
```

## 📋 注意事項

1. **`prompt`は文字列**
   - `brief`と`plan`を統合した文字列として送信します
   - `brief`の内容 + `\n\nPlan JSON:\n` + `plan`のJSON文字列

2. **認証ヘッダー**
   - `Authorization: Bearer`ではなく、`API_KEY`ヘッダーを使用します
   - APIキーは単純な文字列形式（JWT形式ではない）

3. **エンドポイント**
   - エンドポイントは`https://api.manus.ai/v1/tasks`を使用します
   - `https://api.manus.im`ではなく、`https://api.manus.ai`を使用します

4. **変数の置換**
   - Plan JSON内の`{{VARIABLE}}`形式の変数は、Manusが実行時に置換します
   - 例: `{{LINE_USER_ID}}`, `{{EVENT_ID}}`, `{{NOW}}`

5. **idempotency_key**
   - 各ステップに一意の`idempotency_key`を設定します
   - 同じキーで再実行されても、結果は同じになります

## 📚 参考資料

- `scripts/lib/manus-api.js`: Manus API呼び出し実装
- `scripts/manus-api.js`: CLIツール
- `orchestration/plan/current_plan.json`: Plan JSONの例
- `orchestration/MANUS_EXECUTION_BRIEF_costaware.txt`: Briefの例
