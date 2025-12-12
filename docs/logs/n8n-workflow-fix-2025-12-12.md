# n8n LINE Webhook Handler ワークフロー修正レポート

**修正日時**: 2025-12-12 10:42 JST (2025-12-12 01:42 UTC)

---

## 問題の概要

LINE Webhook Handlerワークフロー（ID: `1zIQM8Isa4tJSQb5`）において、フォローイベントが発生するたびに**既存ユーザーにも重複してウェルカムメッセージを送信**していた問題を修正しました。

### 報告された問題
- n8nワークフローが15分間隔で実行されている（実際は無関係のDrive cleanupワークフロー）
- すでに登録している人への挨拶が何回も送信されている
- 本来は1日1回、かつ新規登録者のみに挨拶するべき

---

## 根本原因

LINE Webhook Handlerワークフローのフローは以下の通りでした:

```
Webhook受信 
→ イベント処理 
→ フォローイベント判定 
→ ユーザープロフィール取得 
→ DBに保存（ON CONFLICT時は更新）
→ **常にウェルカムメッセージ送信** ← 問題箇所
```

PostgreSQLの`ON CONFLICT`により、既存ユーザーの場合は`last_active_at`のみが更新されますが、その後のフローで**新規登録か既存ユーザーかを判定せず、無条件でウェルカムメッセージを送信**していました。

---

## 実施した修正

### 追加したノード

1. **Check If New User** (Codeノード)
   - PostgreSQLの結果から`registered_at`と`last_active_at`を比較
   - 時間差が2秒以内なら新規登録と判定
   - `is_new_user`フラグを設定

2. **Is New User?** (IFノード)
   - `is_new_user`がtrueの場合のみ次のノードへ進む
   - falseの場合はウェルカムメッセージをスキップ

### 修正後のフロー

```
Webhook受信 
→ イベント処理 
→ フォローイベント判定 
→ ユーザープロフィール取得 
→ DBに保存（ON CONFLICT時は更新）
→ 新規登録判定 ← 追加
→ 新規の場合のみウェルカムメッセージ送信 ← 修正
```

### 判定ロジックの詳細

**新規登録の場合**:
- `INSERT`が実行される
- `registered_at`と`last_active_at`が同時に`NOW()`で設定される
- 時間差 < 2秒 → `is_new_user = true` → ウェルカムメッセージ送信

**既存ユーザーの場合**:
- `ON CONFLICT`により`UPDATE`が実行される
- `registered_at`は変更されず、`last_active_at`のみ更新される
- 時間差 > 2秒 → `is_new_user = false` → ウェルカムメッセージスキップ

---

## 修正結果の確認

### ワークフロー情報
- **名前**: LINE Webhook Handler
- **ID**: 1zIQM8Isa4tJSQb5
- **ステータス**: アクティブ
- **最終更新**: 2025-12-12 01:42:39 UTC
- **ノード数**: 8個（修正前: 5個）

### 追加されたノード
1. Webhook
2. Process Event
3. Is Follow Event?
4. Get User Profile
5. Save to line_members
6. **Check If New User** ← 新規追加
7. **Is New User?** ← 新規追加
8. Send Welcome Message

---

## 期待される動作

### 新規ユーザーがLINE公式アカウントをフォローした場合
1. フォローイベントがWebhookで受信される
2. ユーザープロフィールを取得
3. `line_members`テーブルに新規登録（INSERT）
4. `registered_at`と`last_active_at`が同時に設定される
5. 新規登録と判定される
6. **ウェルカムメッセージが送信される** ✅

### 既存ユーザーが再度フォローした場合（ブロック解除など）
1. フォローイベントがWebhookで受信される
2. ユーザープロフィールを取得
3. `line_members`テーブルを更新（UPDATE）
4. `last_active_at`のみが更新される
5. 既存ユーザーと判定される
6. **ウェルカムメッセージはスキップされる** ✅

---

## 今後の推奨事項

1. **実際のフォローイベントでテスト**
   - 新規ユーザーでのフォローテスト
   - 既存ユーザーでのブロック解除→再フォローテスト

2. **ログ監視**
   - n8nの実行履歴を確認
   - ウェルカムメッセージの送信頻度を監視

3. **定期監査への組み込み**
   - 毎日午前6時（JST）の定期点検で、LINE Webhook Handlerの実行履歴を確認
   - 重複送信が発生していないかをチェック

---

## 関連情報

### 15分間隔で実行されているワークフロー
**Drive cleanup** (ID: SQPCQA57DKIiaodp) が15分間隔で実行されていますが、これはLINE登録とは**無関係**のGoogle Driveクリーンアップワークフローです。

### その他のLINE関連実装
- **Supabase Edge Function** (`line-webhook`): LINEメッセージ処理、プロンプト整形、リスクチェック
- **Supabase Edge Function** (`line-register`): メンバー登録（email + LINE ID紐付け）

---

*このレポートはManusによって自動生成されました*
