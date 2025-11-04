# 開発段階と本番環境の運用方針

## 🎯 重要な設計原則

**PCやManusが起動していなくても自動実行されるLINE運行システム**

- ✅ **本番環境**: 完全クラウドベースで自動実行、PC不要、Manus不要
- ✅ **開発段階**: GPT-5やManusを使用してPlan JSONを確定
- ✅ **移行**: 開発段階で確定されたPlan JSONを本番環境で使用

## 📊 実行環境の違い

### 本番環境（完全自動実行）

```
LINE Event受信
  ↓
Front Door（Supabase Edge Function - クラウド）
  ↓
GitHub Actions（クラウド）
  ├─ 確定されたPlan JSONを読み込み
  ├─ Supabaseにデータ保存（クラウド）
  └─ LINE APIでメッセージ送信（クラウド）
  ↓
完了（PC不要、Manus不要、GPT-5不要）
```

**必要なもの**:
- ✅ GitHub Actions（クラウド）
- ✅ Supabase Edge Function（クラウド）
- ✅ Supabase（クラウド）
- ✅ LINE API（クラウド）
- ✅ 確定されたPlan JSON（開発段階で生成済み）

**不要なもの**:
- ❌ PCの起動
- ❌ Manusの起動
- ❌ GPT-5の実行
- ❌ Manus APIの呼び出し

### 開発段階（GPT-5/Manus使用）

```
LINE Event受信
  ↓
Front Door（Supabase Edge Function）
  ↓
GitHub Actions
  ├─ GPT-5で思考・解析
  │   ├─ Plan JSONを生成
  │   └─ リスク評価
  ├─ Manus APIに実行指示（テスト）
  ├─ Progress Eventを受信
  ├─ GPT-5で再思考・解析
  └─ PlanDeltaを生成
  ↓
確定されたPlan JSONを保存
  ↓
本番環境で使用可能な状態に
```

**必要なもの**:
- ✅ GPT-5（開発段階のみ）
- ✅ Manus API（開発段階のみ）
- ✅ GitHub Actions（クラウド）
- ✅ Supabase Edge Function（クラウド）

## 🔄 開発段階から本番環境への移行フロー

### 1. 開発段階

```bash
# 開発モードを有効化
gh variable set DEVELOPMENT_MODE --body "true"
gh variable set GPT_ENABLED --body "true"
gh variable set MANUS_ENABLED --body "true"

# GPT-5でPlan JSONを生成
# Manus APIで実行テスト
# Plan JSONを確定
```

### 2. 本番環境への移行

```bash
# 開発モードを無効化
gh variable set DEVELOPMENT_MODE --body "false"
gh variable set GPT_ENABLED --body "false"
gh variable set MANUS_ENABLED --body "false"

# 確定されたPlan JSONを本番環境用にコピー
cp orchestration/plan/development/current_plan.json \
   orchestration/plan/production/current_plan.json
```

### 3. 本番環境での実行

```bash
# 確定されたPlan JSONを使用して自動実行
# GPT-5やManusは使用しない
# PCやManusが起動していなくても動作
```

## 📝 実装方針

### 環境変数による制御

```bash
# GitHub Variables
DEVELOPMENT_MODE=false  # 本番環境ではfalse
GPT_ENABLED=false       # 本番環境ではfalse
MANUS_ENABLED=false     # 本番環境ではfalse
```

### ワークフローの条件分岐

```yaml
# .github/workflows/line-event.yml

- name: Generate Plan with GPT-5 (Development Only)
  if: vars.DEVELOPMENT_MODE == 'true'
  env:
    GPT_ENABLED: ${{ vars.GPT_ENABLED }}
  run: |
    if [ "$GPT_ENABLED" = "true" ]; then
      echo "🔧 Development mode: Generating plan with GPT-5"
      node scripts/generate-plan.js
    fi

- name: Load Predefined Plan (Production)
  if: vars.DEVELOPMENT_MODE != 'true'
  run: |
    echo "🚀 Production mode: Using predefined plan"
    cp orchestration/plan/production/current_plan.json \
       orchestration/plan/current_plan.json

- name: Execute Plan
  run: |
    node scripts/execute-plan.js
```

## ✅ 現在の実装状況

### 実装済み

- ✅ Front Door（Supabase Edge Function）: クラウドベースで常時稼働
- ✅ GitHub Actionsワークフロー: クラウドベースで自動実行
- ✅ Supabase連携: クラウドベースでデータ保存
- ✅ LINE API連携: クラウドベースでメッセージ送信

### 要実装

- ⚠️ 開発段階/本番環境の切り替え機能
- ⚠️ 確定されたPlan JSONの管理（development/production）
- ⚠️ GPT-5/Manusの条件付き実行

## 🎯 まとめ

**PCやManusが起動していなくても自動実行されるLINE運行システム**

- ✅ **本番環境**: 完全クラウドベースで自動実行、PC不要、Manus不要、GPT-5不要
- ✅ **開発段階**: GPT-5とManusを使用してPlan JSONを確定
- ✅ **移行**: 開発段階で確定されたPlan JSONを本番環境で使用

現在のアーキテクチャは既にクラウドベースで自動実行可能です。開発段階/本番環境の切り替え機能を追加することで、完全な自動実行システムを実現できます。

