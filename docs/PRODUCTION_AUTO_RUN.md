# LINE運行システム - 自動実行アーキテクチャ

## 🎯 重要な設計原則

**PCやManusが起動していなくても自動実行されるLINE運行システム**

- ✅ **完全自動実行**: GitHub Actionsベースでクラウド上で実行
- ✅ **開発段階のみ**: GPT-5やManusが駆動するのは開発段階のみ
- ✅ **本番環境**: クラウドベースで自動実行、PC不要

## 🏗️ アーキテクチャ

### 本番環境の実行フロー

```
[LINE] ─┐
        ├→ Front Door（Supabase Edge Function）→ GitHub API repository_dispatch
[Manus Progress] ─┘                                   └→ GitHub Actions（クラウド）
                                                            ├→ GPT（開発段階のみ）
                                                            ├→ Manus API（開発段階のみ）
                                                            ├→ Supabase（ログ/指標）
                                                            └→ LINE返信
```

### 実行環境

#### 本番環境（自動実行）

- **Front Door**: Supabase Edge Function（常時稼働、クラウド）
- **GitHub Actions**: クラウドベースで自動実行
- **Supabase**: クラウドベースでデータ保存
- **LINE API**: クラウドベースでメッセージ送信

**PCやManusが起動していなくても動作します** ✅

#### 開発段階のみ

- **GPT-5**: 開発段階でPlan生成や解析に使用
- **Manus API**: 開発段階で実行テストに使用

## 📊 実行フロー

### 本番環境の実行フロー

```
1. LINE Event受信
   ↓
2. Front Door（Supabase Edge Function）
   ├─ 署名検証
   ├─ イベントをログに記録
   └─ GitHub API repository_dispatchを呼び出し
   ↓
3. GitHub Actions（クラウド上で自動実行）
   ├─ LINE Eventを解析
   ├─ Plan JSONを読み込み（開発段階で生成済み）
   ├─ Supabaseにデータ保存
   └─ LINE APIでメッセージ送信
   ↓
4. 完了（PC不要）
```

### 開発段階の実行フロー

```
1. LINE Event受信
   ↓
2. Front Door（Supabase Edge Function）
   ↓
3. GitHub Actions（クラウド上で自動実行）
   ├─ GPT-5で思考・解析（開発段階のみ）
   │   ├─ Plan JSONを生成
   │   └─ リスク評価
   ├─ Manus APIに実行指示（開発段階のみ）
   │   ├─ Plan JSONを送信
   │   └─ 実行テスト
   ├─ Progress Eventを受信
   ├─ GPT-5で再思考・解析（開発段階のみ）
   └─ PlanDeltaを生成
   ↓
4. 本番環境用のPlan JSONを確定
   ↓
5. 本番環境では確定されたPlan JSONを使用（GPT-5/Manus不要）
```

## 🔄 開発段階から本番環境への移行

### 開発段階（GPT-5/Manus使用）

```yaml
# .github/workflows/line-event.yml（開発段階）
- name: Generate Plan with GPT-5
  if: env.DEVELOPMENT_MODE == 'true'
  run: |
    # GPT-5でPlan JSONを生成
    node scripts/generate-plan.js

- name: Test with Manus API
  if: env.DEVELOPMENT_MODE == 'true'
  run: |
    # Manus APIで実行テスト
    node scripts/manus-api.js create \
      orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
      orchestration/plan/current_plan.json \
      --webhook "$PROGRESS_WEBHOOK_URL"
```

### 本番環境（確定されたPlan JSON使用）

```yaml
# .github/workflows/line-event.yml（本番環境）
- name: Load Predefined Plan
  if: env.DEVELOPMENT_MODE != 'true'
  run: |
    # 開発段階で確定されたPlan JSONを使用
    cp orchestration/plan/production_plan.json orchestration/plan/current_plan.json

- name: Execute Plan
  run: |
    # 確定されたPlan JSONを実行
    node scripts/execute-plan.js
```

## 🚀 本番環境の要件

### 必須要件

1. **完全自動実行**
   - GitHub Actionsがクラウド上で自動実行
   - PCやManusが起動していなくても動作

2. **クラウドベース**
   - Front Door: Supabase Edge Function（常時稼働）
   - ワークフロー: GitHub Actions（クラウド）
   - データ保存: Supabase（クラウド）
   - メッセージ送信: LINE API（クラウド）

3. **開発段階で確定されたPlan JSON**
   - 開発段階でGPT-5とManusを使ってPlan JSONを確定
   - 本番環境では確定されたPlan JSONを使用

### 不要なもの（本番環境）

- ❌ PCの起動
- ❌ Manusの起動
- ❌ GPT-5の実行（開発段階のみ）
- ❌ Manus APIの呼び出し（開発段階のみ）

## 📝 実装方針

### 1. 環境変数による制御

```bash
# GitHub Variables
DEVELOPMENT_MODE=false  # 本番環境ではfalse
GPT_ENABLED=false       # 本番環境ではfalse
MANUS_ENABLED=false     # 本番環境ではfalse
```

### 2. ワークフローの条件分岐

```yaml
- name: Generate Plan with GPT-5
  if: vars.DEVELOPMENT_MODE == 'true'
  env:
    GPT_ENABLED: ${{ vars.GPT_ENABLED }}
  run: |
    if [ "$GPT_ENABLED" = "true" ]; then
      node scripts/generate-plan.js
    fi

- name: Execute with Manus API
  if: vars.DEVELOPMENT_MODE == 'true'
  env:
    MANUS_ENABLED: ${{ vars.MANUS_ENABLED }}
  run: |
    if [ "$MANUS_ENABLED" = "true" ]; then
      node scripts/manus-api.js create \
        orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
        orchestration/plan/current_plan.json \
        --webhook "$PROGRESS_WEBHOOK_URL"
    fi

- name: Execute Predefined Plan
  if: vars.DEVELOPMENT_MODE != 'true'
  run: |
    # 開発段階で確定されたPlan JSONを使用
    node scripts/execute-plan.js
```

### 3. Plan JSONの管理

```
orchestration/plan/
├── development/          # 開発段階用
│   ├── current_plan.json
│   └── plan_delta.json
└── production/           # 本番環境用
    └── current_plan.json  # 開発段階で確定されたPlan JSON
```

## 🛡️ 運用ガードレール

- **配信頻度**: 同一ユーザーへの自動配信は 1 日 1 通／週次 3 通まで。`line-event.yml` と PlanDelta 判定で超過を抑制し、例外配信は Ops Lead 承認のもと `logs/progress/` に記録する。
- **Google Sheets 台帳**: Supabase への完全移行まで暫定運用。編集権限は Tech Lead / Ops Lead に限定し、月次で Supabase との差分を照合。移行完了後は 6 か月でアーカイブ削除。
- **縮退運用**: `economic-circuit-breaker.yml` が閾値を超えた場合に `MANUS_ENABLED=false` と `degraded.flag` を設定。縮退時は `docs/alerts/line_degraded_outreach.ics` を送付し、Ops が 24 時間以内に手動フォローを完了させる。
- **ログローテーション**: `scripts/rotate-logs.sh` と `rotate-logs.yml` で 90 日保持／月次アーカイブ／1 年削除を自動化。リポジトリサイズの警告閾値（100MB/200MB）を超えた場合はアラートを確認する。

## ✅ 現在の実装状況

### 実装済み

- ✅ Front Door（Supabase Edge Function）: クラウドベースで常時稼働
- ✅ GitHub Actionsワークフロー: クラウドベースで自動実行
- ✅ Supabase連携: クラウドベースでデータ保存
- ✅ LINE API連携: クラウドベースでメッセージ送信

### 要実装

- ⚠️ 開発段階/本番環境の切り替え機能
- ⚠️ 確定されたPlan JSONの管理
- ⚠️ GPT-5/Manusの条件付き実行

## 🎯 まとめ

**PCやManusが起動していなくても自動実行されるLINE運行システム**

- ✅ **本番環境**: クラウドベースで完全自動実行、PC不要
- ✅ **開発段階**: GPT-5とManusを使用してPlan JSONを確定
- ✅ **移行**: 開発段階で確定されたPlan JSONを本番環境で使用

現在のアーキテクチャは既にクラウドベースで自動実行可能ですが、開発段階/本番環境の切り替え機能を追加する必要があります。
