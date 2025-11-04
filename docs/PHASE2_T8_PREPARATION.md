# Phase2 T8作業準備ガイド

## 📋 現在の状況

### Phase1完了
- ✅ T5/T6/T7: 完了・コミット・プッシュ済み
- ✅ PR #5: 作成済み（`phase1/core-hardening`）
- ⏳ PR #5のレビュー・マージ待ち

### Phase2 T8準備
- ⚠️ ローカルに変更あり（未コミット）
- 変更ファイル:
  - `.github/workflows/weekly-kpi-report.yml`
  - `package.json`
  - `scripts/kpi/generate-kpi-report.js`（存在確認済み）
  - `tests/node/kpi-report.test.mjs`（存在確認済み）
  - `docs/PROGRESS_STATUS.md`
  - `.sdd/specs/line-funnel/tasks.md`

## 🎯 推奨作業フロー

### ステップ1: PR #5のマージを待つ

PR #5がマージされるまで待機します。これにより、`main`ブランチにPhase1の変更が取り込まれます。

```bash
# PR #5のマージ状況を確認
gh pr view 5
```

### ステップ2: Phase2 T8用のブランチ作成（マージ後）

PR #5がマージされたら、新しいブランチを作成します:

```bash
# mainブランチに切り替え
git checkout main

# 最新の変更を取得
git pull origin main

# Phase2 T8用のブランチを作成
git checkout -b phase2/t8-kpi-report
```

### ステップ3: ローカル変更を新しいブランチに移す

現在のローカル変更を新しいブランチに適用します:

```bash
# 変更ファイルをステージング
git add .github/workflows/weekly-kpi-report.yml
git add package.json
git add scripts/kpi/generate-kpi-report.js
git add tests/node/kpi-report.test.mjs
git add docs/PROGRESS_STATUS.md
git add .sdd/specs/line-funnel/tasks.md

# コミット
git commit -m "feat: add weekly KPI report workflow (T8)

- Update weekly-kpi-report.yml with realistic configuration
- Add KPI aggregation logic (scripts/kpi/generate-kpi-report.js)
- Add Node tests for KPI report (tests/node/kpi-report.test.mjs)
- Update PROGRESS_STATUS.md and tasks.md for Phase2"

# プッシュ
git push -u origin phase2/t8-kpi-report
```

### ステップ4: PR作成

```bash
gh pr create \
  --title "feat: Phase2 T8 - Weekly KPI Report Workflow" \
  --body "## Phase2 T8: 週次KPIレポートワークフロー

### 変更内容
- 週次KPIワークフローを現実的な構成に刷新
- KPI集計ロジックをモジュール化
- KPI向けNodeテストを新設
- 進捗サマリーとタスク表をPhase2向けに更新

### テスト
- npm test 実行済み

### 関連タスク
- T8: Deliver KPI reporting workflow" \
  --base main \
  --head phase2/t8-kpi-report
```

## 📝 現在のアクション（PR #5マージ待ち中）

PR #5のマージを待つ間、以下の準備をしておくことができます:

### 1. 変更ファイルの確認

```bash
# 変更内容の確認
git diff .github/workflows/weekly-kpi-report.yml
git diff package.json
git diff docs/PROGRESS_STATUS.md
```

### 2. テスト実行の確認

```bash
# npm test の実行
npm test
```

### 3. コミットメッセージの準備

上記のコミットメッセージを参考に、必要に応じて調整してください。

## ⚠️ 注意事項

### Git権限について

現在、Git操作は正常に動作していますが、もし`git add`で`index.lock`エラーが発生した場合は、以下を実行してください:

```bash
sudo chflags -R nouchg .git
sudo chmod -R u+rwX .git
sudo xattr -dr com.apple.provenance .git

# 確認
touch .git/testfile && rm .git/testfile
git status
```

### ブランチ切り替え時の注意

`phase1/core-hardening`ブランチから`main`に切り替える際は、ローカルの変更が失われないように注意してください。必要に応じて`git stash`を使用します。

## 🔗 関連ドキュメント

- `docs/PROGRESS_STATUS.md`: 進捗状況
- `.sdd/specs/line-funnel/tasks.md`: タスク一覧

