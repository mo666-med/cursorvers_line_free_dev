# Miyabiガイド

## 概要

Miyabiは、LINE友だち登録システム構築のための自律型開発環境です。

## Miyabiの役割

Miyabiは、**LINEシステム構築のための支援ツール**として機能しています。

### Issue #1: プロジェクト全体の推敲と改善

**目的**: LINE友だち登録システムのプロジェクト全体を推敲し、以下の観点から改善を実施

- README.mdの改善（LINEシステムの説明を明確化）
- コードの品質向上（LINEシステムのコード品質向上）
- ドキュメントの整備（LINEシステムのドキュメント整備）
- GitHub Actionsワークフローの最適化（LINEシステムのワークフロー最適化）

### Issue #2: Manus API連動の実装

**目的**: GitHub ActionsワークフローからManus APIを呼び出して、LINE友だち登録システムと連動させる

- `line-event.yml`の実装: LINE EventからPlan JSONを生成し、Manus APIを呼び出してタスクを作成
- `manus-progress.yml`の実装: Progress Eventを解析し、LINEシステムの状態を更新

## エージェントの実行フロー

```
Issue作成/検出
    ↓
CoordinatorAgent（タスク分解・DAG構築）
    ↓ 並行実行
├─ IssueAgent（分析・Label付与）
├─ CodeGenAgent（GPT-5でコード生成）
├─ ReviewAgent（品質チェック≥80点）
└─ TestAgent（テスト実行）
    ↓
PRAgent（Draft PR作成）
    ↓
人間レビュー待ち
```

## 使用方法

### 🌟 自然言語モード（デフォルト推奨）

Miyabiは自然言語での指示に対応しています。`scripts/miyabi-chat.sh`を実行すると、日本語で自然に指示を出せます。

```bash
# スクリプトを起動
./scripts/miyabi-chat.sh

# 自然言語で指示を入力
Miyabi > Issue #3を処理して
Miyabi > オープンなIssue一覧を見せて
Miyabi > Issue #2を実行して
```

**特徴:**
- ✅ 日本語で自然に指示可能
- ✅ OpenAI API (GPT-5) を使用して指示を解析
- ✅ 自動的に適切なアクションを実行
- ✅ Issue処理、一覧表示、作成、更新に対応

**必要な環境変数:**
```bash
# .envファイルに設定（ローカル実行時）
OPENAI_API_KEY=sk-proj-...

# GitHub Secretsに設定（GitHub Actions実行時）
gh secret set OPENAI_API_KEY --body "sk-proj-..."
```

**利用可能なアクション:**
- `issue_list`: Issue一覧を表示
- `issue_process`: 特定のIssueを処理（codex-agent.jsを実行）
- `issue_create`: 新しいIssueを作成（実装予定）
- `issue_update`: Issueを更新（実装予定）

### Issueにラベルを追加して実行

```bash
# Issue #1に🤖agent-executeラベルを追加
gh issue edit 1 --add-label "🤖agent-execute"

# Issue #2に🤖agent-executeラベルを追加
gh issue edit 2 --add-label "🤖agent-execute"
```

### 手動でワークフローを実行

```bash
# Issue #1を処理
gh workflow run autonomous-agent.yml -f issue_number=1

# Issue #2を処理
gh workflow run autonomous-agent.yml -f issue_number=2
```

### 進捗確認

```bash
# Miyabi Statusを確認
npx miyabi status

# ウォッチモード（5秒ごと自動更新）
npx miyabi status --watch

# 進捗レポートを表示
./scripts/miyabi-progress.sh
```

## 進捗モニタリング

### GitHub Actionsで確認

```bash
# 最新の実行を確認
gh run list --workflow="autonomous-agent.yml" --limit 10

# Issueイベントでトリガーされた実行のみ
gh run list --workflow="autonomous-agent.yml" --limit 10 --json event,status,conclusion,createdAt --jq '.[] | select(.event == "issues")'

# 実行中のワークフローのみ
gh run list --workflow="autonomous-agent.yml" --limit 10 --json status --jq '.[] | select(.status == "in_progress" or .status == "queued")'
```

### Issueの状態確認

```bash
# Issue #1の状態
gh issue view 1

# Issueのコメントを確認
gh issue view 1 --comments

# Issueのラベル変更履歴
gh issue view 1 --json labels --jq '.labels[] | .name'
```

### Pull Requestの確認

```bash
# 作成されたPRを確認
gh pr list

# エージェントが作成したPRを確認
gh pr list --label "🤖agent-generated"

# 特定のPRの詳細
gh pr view <pr-number>
```

## Codex（Cursor）との互換性

Miyabiは主にClaude Code向けに設計されていますが、Codex（Cursor）でも動作するようにカスタマイズ可能です。

### 現在の実装

- ✅ OpenAI APIを使用（GPT-5）
- ✅ `scripts/codex-agent.js`で実行
- ✅ `autonomous-agent.yml`ワークフローで統合

詳細は `GPT5_CODEX_USAGE.md` を参照してください。

## トラブルシューティング

### ワークフローが実行されない場合

1. **ラベルが正しく追加されているか確認**
   ```bash
   gh issue view 1 --json labels --jq '.labels[] | .name'
   ```

2. **ワークフローの設定を確認**
   ```bash
   gh workflow view autonomous-agent.yml --yaml
   ```

3. **APIキーが設定されているか確認**
   ```bash
   gh secret list | grep OPENAI_API_KEY
   ```

### APIキーが設定されていない場合

```bash
# OPENAI_API_KEYを設定
gh secret set OPENAI_API_KEY --body "sk-..."

# LLM_ENDPOINTを設定
gh secret set LLM_ENDPOINT --body "https://api.openai.com/v1/chat/completions"
```

詳細は `TROUBLESHOOTING.md` を参照してください。

