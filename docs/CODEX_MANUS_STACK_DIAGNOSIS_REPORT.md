# Manus連携スタック原因診断報告書

## 📋 報告概要

**日時**: 2025-11-01  
**対象**: Manus API連携のスタック（実行されない）問題  
**診断結果**: GitHub Variables未設定が原因で、Manus呼び出しステップがスキップされている

## 🔍 問題の状況

### 症状
- GitHub Actionsワークフロー（`line-event.yml`）は実行されている
- しかし「Dispatch to Manus」ステップが実行されない（スキップされている）
- Manus APIへのタスク作成が行われていない

### 影響範囲
- LINE Event HandlerワークフローでManus APIが呼び出されない
- 開発段階でのManus連携テストが実行できない

## 🔬 診断実施内容

### 1. 必須ファイルの確認
✅ **結果**: すべて存在
- `orchestration/plan/current_plan.json`: 存在
- `orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt`: 存在
- `orchestration/plan/production/degraded.flag`: 不存在（正常）

### 2. GitHub Secretsの確認
✅ **結果**: 設定済み
- `MANUS_API_KEY`: 設定済み
- `PROGRESS_WEBHOOK_URL`: 設定済み

### 3. GitHub Variablesの確認
❌ **結果**: **未設定**（原因）
- `DEVELOPMENT_MODE`: **未設定**
- `MANUS_ENABLED`: **未設定**
- `MANUS_BASE_URL`: **未設定**
- `DEGRADED_MODE`: 未設定（正常）

### 4. ワークフロー実行条件の確認

`line-event.yml`の166-167行目の条件：

```yaml
- name: Dispatch to Manus (Development Only)
  if: vars.DEVELOPMENT_MODE == 'true' && vars.MANUS_ENABLED == 'true' && steps.mode.outputs.mode != 'degraded'
```

**診断結果**:
- ❌ 条件1: `vars.DEVELOPMENT_MODE == 'true'` → **失敗**（未設定）
- ❌ 条件2: `vars.MANUS_ENABLED == 'true'` → **失敗**（未設定）
- ❌ 条件3: `steps.mode.outputs.mode != 'degraded'` → **失敗**（MANUS_ENABLED未設定によりdegradedモード判定）

## 🎯 根本原因

**GitHub Variablesが未設定のため、ワークフローの条件分岐で「Dispatch to Manus」ステップがスキップされている**

### 詳細な原因分析

1. **`vars.DEVELOPMENT_MODE`未設定**
   - 開発モードが有効になっていない
   - 開発段階の処理がスキップされる

2. **`vars.MANUS_ENABLED`未設定**
   - Manus連携が有効になっていない
   - `line-event.yml`の「Resolve Plan Mode」ステップで`degraded`モードと判定される

3. **`vars.MANUS_BASE_URL`未設定**
   - Manus APIのエンドポイントが指定されていない
   - 実行されてもAPI呼び出しが失敗する可能性

## ✅ 解決方法

### 必須の設定手順

以下のコマンドでGitHub Variablesを設定してください：

```bash
# 開発モードを有効化
gh variable set DEVELOPMENT_MODE --body "true"

# Manus連携を有効化
gh variable set MANUS_ENABLED --body "true"

# Manus APIのベースURLを設定
gh variable set MANUS_BASE_URL --body "https://api.manus.ai"
```

### 設定後の確認

```bash
# Variablesの設定を確認
gh variable list | grep -E "DEVELOPMENT_MODE|MANUS_ENABLED|MANUS_BASE_URL"

# ワークフローを手動実行してテスト
gh workflow run line-event.yml --ref main
```

### 期待される動作

設定後、以下のようになります：

1. **ワークフロー実行時**
   - 「Resolve Plan Mode」ステップで`mode=normal`が出力される
   - 「Dispatch to Manus」ステップが実行される
   - `🚀 Calling Manus API to create task...`がログに表示される

2. **Manus API呼び出し**
   - `scripts/manus-api.js`が実行される
   - Manus APIにタスクが作成される
   - タスクIDが返される

## 🛠️ 実施した作業

### 1. 診断スクリプトの作成
- `scripts/diagnose-manus-stack.sh`を作成
- GitHub Variables、Secrets、必須ファイルを自動診断
- ワークフロー実行条件をチェック

### 2. 診断ドキュメントの作成
- `docs/MANUS_STACK_DIAGNOSIS.md`を作成
- スタック原因の診断手順とトラブルシューティングガイド

### 3. 診断の実行
- 診断スクリプトを実行して原因を特定
- GitHub Variablesの未設定を確認

## 📝 関連ファイル

### ワークフローファイル
- `.github/workflows/line-event.yml`: メインワークフロー（166-192行目がManus呼び出し）

### 設定ファイル
- `orchestration/plan/current_plan.json`: Plan JSONファイル
- `orchestration/MANUS_EXECUTION_BRIEF_v2.0.txt`: Briefファイル

### スクリプト
- `scripts/manus-api.js`: Manus API呼び出しスクリプト
- `scripts/diagnose-manus-stack.sh`: 診断スクリプト（新規作成）

### ドキュメント
- `docs/MANUS_STACK_DIAGNOSIS.md`: 診断ガイド（新規作成）
- `docs/CODEX_MANUS_STACK_DIAGNOSIS_REPORT.md`: 本報告書（新規作成）

## 🚨 注意事項

1. **GitHub Variablesの設定**
   - Variablesはリポジトリレベルで設定される
   - `gh variable set`コマンドで設定するか、GitHub UIで設定可能

2. **本番環境への移行時**
   - 本番環境では`DEVELOPMENT_MODE`と`MANUS_ENABLED`を`false`に設定
   - 確定されたPlan JSONを使用する

3. **degradedモード**
   - `MANUS_ENABLED=false`または`DEGRADED_MODE=true`の場合、Manus呼び出しがスキップされる
   - `orchestration/plan/production/degraded.flag`ファイルが存在する場合もスキップされる

## 📊 次のステップ

1. ✅ GitHub Variablesを設定（上記のコマンド実行）
2. ✅ ワークフローを手動実行してテスト
3. ✅ 実行ログで「Dispatch to Manus」ステップが実行されていることを確認
4. ✅ Manus APIからタスクIDが返されることを確認

## 🔗 関連ドキュメント

- `docs/MANUS_STACK_DIAGNOSIS.md`: 詳細な診断手順
- `docs/MANUS_API.md`: Manus API連動ガイド
- `docs/CODEX_MANUS_OPERATION_GUIDE.md`: Codex向けManus操作ガイド
- `README.md`: プロジェクト全体のセットアップガイド

---

**報告者**: Codex  
**報告日時**: 2025-11-01  
**状態**: ✅ 原因特定完了、解決方法提示済み

