# Manus統合提案：定期監査・メンテナンス

## 現状分析

### 現在の監視状況
- ✅ GitHub Actions失敗通知（Discord Webhook）
- ✅ 配信履歴記録（`line_card_broadcasts`テーブル）
- ✅ 統計ビュー（日次統計・テーマ統計）
- ❌ 自動監査・メンテナンスなし

### 潜在的な問題
1. **カード在庫枯渇**: 各テーマのカード数が少なくなっても気づかない
2. **配信失敗の蓄積**: 失敗率が高くなっても自動検知しない
3. **データベース健全性**: 異常な状態になっても気づかない
4. **定期メンテナンス**: 手動で確認する必要がある

---

## Manus統合のメリット

### ✅ 推奨する理由
1. **自動監査**: 週次/月次で自動的にシステム健全性をチェック
2. **早期警告**: 問題が深刻化する前にアラート
3. **メンテナンス自動化**: 定期的なクリーンアップや最適化を自動実行
4. **レポート生成**: 運用状況を定期的に報告

### 実装すべき監査項目

#### 1. カード在庫監査（週次）
- 各テーマの`ready`カード数が50枚以下になったら警告
- 全てのテーマで`ready`カードが0になったら緊急アラート

#### 2. 配信成功率監査（週次）
- 過去7日間の成功率が90%未満なら警告
- 連続3日失敗したら緊急アラート

#### 3. データベース健全性監査（月次）
- 重複カードの検出
- 異常に多い`times_used`のカードを検出
- インデックスの健全性チェック

#### 4. 自動メンテナンス（月次）
- 古い配信履歴のアーカイブ（90日以上前）
- 使用されていないカードのアーカイブ（1年以上未使用）

---

## 実装案

### オプション1: Manus Edge Functionを作成（推奨）
- `supabase/functions/manus-audit-line-daily-brief`
- 週次/月次で実行
- 監査結果をDiscordに通知

### オプション2: GitHub Actionsワークフロー
- `.github/workflows/manus-audit.yml`
- 週次で実行
- 監査結果をDiscordに通知

### オプション3: 既存のEdge Functionに統合
- `line-daily-brief`に監査ロジックを追加
- 配信時に簡易チェックを実行

---

## 推奨実装

**オプション1（Manus Edge Function）を推奨**

理由：
- 監査ロジックを分離して保守しやすい
- 配信ロジックに影響を与えない
- スケジュールを柔軟に設定できる
- 他のシステム（LINE Bot、Stripe Webhook等）にも拡張可能

---

## 実装コスト vs メリット

### コスト
- 開発時間: 2-3時間
- 運用コスト: ほぼゼロ（Edge Functionは使用量ベース）

### メリット
- 問題の早期発見
- 運用負荷の軽減
- システムの信頼性向上
- 長期的な保守性向上

**結論: 実装を推奨** ⭐⭐⭐⭐☆

---

## 実装しない場合のリスク

1. カード在庫が枯渇して配信が停止
2. 配信失敗が蓄積して気づかない
3. データベースの異常が発見されない
4. 手動監視の負荷が継続

---

## 推奨事項

**実装を推奨します。**

特に以下の理由から：
- 現在は手動監視が必要
- カード在庫の監視が重要（696枚だが、テーマ別に偏る可能性）
- 配信失敗の早期検知が必要
- 運用負荷を軽減できる

実装する場合は、まず週次監査から開始し、必要に応じて月次メンテナンスを追加することを推奨します。

---

## 実装完了 ✅

### 実装内容

1. **Edge Function**: `supabase/functions/manus-audit-line-daily-brief/index.ts`
   - 週次監査: カード在庫・配信成功率チェック
   - 月次監査: データベース健全性チェック + メンテナンス
   - Discord通知機能

2. **GitHub Actionsワークフロー**:
   - `.github/workflows/manus-audit-weekly.yml`: 毎週月曜日 09:00 JST
   - `.github/workflows/manus-audit-monthly.yml`: 毎月1日 10:00 JST

3. **必要な環境変数**:
   - `MANUS_AUDIT_API_KEY`: Edge Function認証用APIキー
   - `DISCORD_ADMIN_WEBHOOK_URL`: 監査結果通知用（任意）

### デプロイ手順

1. Edge Functionをデプロイ:
```bash
supabase functions deploy manus-audit-line-daily-brief --no-verify-jwt --project-ref haaxgwyimoqzzxzdaeep
```

2. Supabaseシークレットを設定:
```bash
supabase secrets set MANUS_AUDIT_API_KEY=<your-api-key>
supabase secrets set DISCORD_ADMIN_WEBHOOK_URL=<your-webhook-url>
```

3. GitHub Secretsを設定:
   - `MANUS_AUDIT_API_KEY`: Edge Function認証用APIキー（Supabaseと同じ値）

4. テスト実行:
```bash
curl -X POST "https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/manus-audit-line-daily-brief?mode=weekly" \
  -H "X-API-Key: <your-api-key>"
```

