# Miyabiの理解確認 - LINEシステム構築がメイン

## 🎯 プロジェクトの主目的

**メインの目的**: **LINE友だち登録システムの構築と運用**

このプロジェクトは、医療AI監査・コンサルティングサービス（Cursorvers）のトップオブファネルとして、公開ノートブログからLINEチャネルへのリード獲得を自動化するシステムです。

## 🤖 Miyabiの役割と理解

Miyabiは、**LINEシステム構築のための支援ツール**として機能しています。

### Issue #1: プロジェクト全体の推敲と改善

**目的**: LINE友だち登録システムのプロジェクト全体を推敲し、以下の観点から改善を実施

- README.mdの改善（LINEシステムの説明を明確化）
- コードの品質向上（LINEシステムのコード品質向上）
- ドキュメントの整備（LINEシステムのドキュメント整備）
- GitHub Actionsワークフローの最適化（LINEシステムのワークフロー最適化）

**Miyabiの理解**: ✅ LINEシステムのプロジェクト全体を改善することで、システムの品質を向上させる

### Issue #2: Manus API連動の実装

**目的**: GitHub ActionsワークフローからManus APIを呼び出して、**LINE友だち登録システムと連動させる**

- `line-event.yml`の実装: LINE EventからPlan JSONを生成し、Manus APIを呼び出してタスクを作成
- `manus-progress.yml`の実装: Progress Eventを解析し、LINEシステムの状態を更新

**Miyabiの理解**: ✅ LINEシステムとManus APIを連動させることで、LINEシステムの機能を拡張する

## 📊 システムアーキテクチャとの関係

### LINEシステムのアーキテクチャ

```
[LINE] ─┐
        ├→ Front Door（Supabase Edge Function）→ GitHub API repository_dispatch
[Manus Progress] ─┘                                   └→ GitHub Actions
                                                            ├→ GPT（解析/シミュレーション）
                                                            ├→ Manus API（実行指示）
                                                            ├→ Supabase（ログ/指標）
                                                            └→ LINE返信
```

### Miyabiの支援内容

1. **システムの改善**（Issue #1）
   - LINEシステムのコード品質向上
   - ドキュメント整備
   - ワークフロー最適化

2. **機能拡張**（Issue #2）
   - LINE EventとManus APIの連動
   - 自動実行フローの実装

## ✅ 確認事項

### Miyabiが理解していること

1. ✅ **プロジェクトの主目的**: LINE友だち登録システムの構築と運用
2. ✅ **Issue #1の目的**: LINEシステムのプロジェクト全体を推敲・改善
3. ✅ **Issue #2の目的**: LINEシステムとManus APIを連動させる実装
4. ✅ **両方のIssueがLINEシステム構築のための支援であること**

### Miyabiの実行フロー

```
Issue作成/検出
    ↓
CoordinatorAgent（タスク分解・DAG構築）
    ↓ 並行実行
├─ IssueAgent（分析・Label付与）
│   └─ LINEシステムのIssueを理解し、適切なラベルを付与
├─ CodeGenAgent（GPT-5でコード生成）
│   └─ LINEシステムのコードを生成・改善
├─ ReviewAgent（品質チェック≥80点）
│   └─ LINEシステムのコード品質をチェック
└─ TestAgent（テスト実行）
    └─ LINEシステムのテストを実行
    ↓
PRAgent（Draft PR作成）
    └─ LINEシステムの改善をPRとして作成
```

## 📝 結論

**Miyabiは理解しています** ✅

- プロジェクトの主目的はLINE友だち登録システムの構築と運用
- Issue #1と#2は、LINEシステム構築のための支援として機能
- Miyabiは、LINEシステムの品質向上と機能拡張を支援する役割を担っている

## 🎯 次のステップ

Miyabiは、LINEシステム構築を支援するために以下を実行します：

1. **Issue #1**: LINEシステムのプロジェクト全体を推敲・改善
2. **Issue #2**: LINEシステムとManus APIを連動させる実装

どちらもLINEシステム構築のための重要な作業です。

