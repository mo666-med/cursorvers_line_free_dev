# 有料課金導線 修繕手順書

**作成日**: 2025年12月8日  
**対象**: 点検レポートで指摘された問題の修正  
**優先度**: 高

---

## 📋 修繕が必要な項目

| 問題 | 優先度 | 影響範囲 | 推定作業時間 |
|------|--------|----------|--------------|
| Stripe本番モード → テストモード | 🔴 最高 | 決済システム全体 | 30分 |
| reCAPTCHA繰り返し表示 | 🟡 中 | ユーザー体験 | 調査中 |

---

## 🔴 最優先: Stripeテストモードへの切り替え

### 理由

現在、本番モード（`sk_live_`）で動作しているため、テスト決済が実際の課金になる可能性があります。

### 手順

#### ステップ1: Stripe Dashboardでテストモードに切り替え

1. [Stripe Dashboard](https://dashboard.stripe.com/)にアクセス
2. 右上の「本番環境」トグルを「テスト環境」に切り替え
3. 左メニューから「製品」→「価格」を選択
4. Library Member用の価格を作成（または既存のテスト価格IDを確認）
   - 製品名: `Library Member`
   - 価格: `¥2,980`
   - 請求サイクル: `月次`
5. 価格ID（`price_test_***`）をコピー

#### ステップ2: Supabaseの環境変数を更新

```bash
# Supabaseプロジェクトにログイン
cd /home/ubuntu/cursorvers_line_free_dev
npx supabase login

# 環境変数を更新
npx supabase secrets set STRIPE_API_KEY="sk_test_YOUR_TEST_KEY"
npx supabase secrets set STRIPE_PRICE_ID_LIBRARY="price_test_YOUR_PRICE_ID"
```

#### ステップ3: Stripe APIキーの取得

1. Stripe Dashboard → 「開発者」→「APIキー」
2. 「テスト環境」タブを選択
3. 「秘密鍵」（`sk_test_`で始まる）をコピー

#### ステップ4: 環境変数の確認

```bash
# 設定された環境変数を確認
npx supabase secrets list
```

**期待される出力**:
```
STRIPE_API_KEY=sk_test_***
STRIPE_PRICE_ID_LIBRARY=price_test_***
```

#### ステップ5: Edge Functionsの再デプロイ

```bash
# create-checkout-sessionを再デプロイ
npx supabase functions deploy create-checkout-session

# stripe-webhookを再デプロイ
npx supabase functions deploy stripe-webhook
```

#### ステップ6: テスト決済の実施

1. [Cursorvers Edu Services](https://cursorvers.github.io/cursorvers-edu/services.html)にアクセス
2. 「Join Library」ボタンをクリック
3. テスト用メールアドレスを入力: `test-stripe-test-mode@example.com`
4. 利用規約とプライバシーポリシーに同意
5. 「Stripeで決済に進む」をクリック
6. Stripe Checkoutページで以下のテストカード情報を入力:
   - カード番号: `4242 4242 4242 4242`
   - 有効期限: 任意の未来の日付（例: `12/34`）
   - CVC: 任意の3桁（例: `123`）
   - 郵便番号: 任意（例: `12345`）
7. 「支払う」ボタンをクリック

#### ステップ7: Webhook処理の確認

1. Supabase Dashboard → Edge Functions → `stripe-webhook` → Logs
2. `checkout.session.completed`イベントのログを確認
3. Supabase Dashboard → Table Editor → `members`テーブル
4. テストメールアドレスのレコードが作成されていることを確認

#### ステップ8: Google Sheets連携の確認

1. Google Sheetsを開く
2. `members`シートに新しい行が追加されていることを確認
3. 以下のカラムが正しく記録されていることを確認:
   - A: email
   - B: tier (`library`)
   - C: registeredAt
   - D: periodEnd
   - E: status (`active`)

---

## 🟡 中優先度: reCAPTCHA問題の調査と修正

### 現状

フロントエンドから決済ボタンをクリックすると、reCAPTCHAが繰り返し表示される問題が発生しています。

### 調査結果

services.htmlにreCAPTCHAの実装は見つかりませんでした。以下の可能性が考えられます：

1. **Cloudflare Bot Management**: GitHub Pagesの前段にCloudflareが配置されている可能性
2. **Stripe Checkout**: Stripe側でreCAPTCHAを自動的に表示している可能性
3. **ブラウザの自動保護機能**: ブラウザ拡張機能やセキュリティ設定

### 推奨対応

#### オプション1: Cloudflareの設定確認（推奨）

1. GitHub Pagesの設定を確認
2. Cloudflareを使用している場合、Bot Management設定を確認
3. 必要に応じて、特定のパスを除外

#### オプション2: 実際のユーザーテスト

1. 異なるブラウザでテスト（Chrome、Firefox、Safari）
2. シークレットモード/プライベートブラウジングでテスト
3. 異なるネットワーク環境でテスト

#### オプション3: reCAPTCHAスコアの確認

Stripe Checkoutページで表示されるreCAPTCHAは、Stripeが自動的に判断して表示しています。以下の要因でスコアが低くなる可能性があります：

- 同じIPアドレスから短時間に複数回アクセス
- ブラウザの自動化ツール（Selenium等）の使用
- VPNやプロキシの使用

**対策**:
- 実際のユーザー環境でテスト
- 時間を空けてテスト
- 異なるIPアドレスからテスト

---

## ✅ 修繕完了チェックリスト

### Stripeテストモード切り替え

- [ ] Stripe Dashboardでテスト環境に切り替え
- [ ] テスト用Price IDを取得
- [ ] Supabase環境変数を更新（`STRIPE_API_KEY`）
- [ ] Supabase環境変数を更新（`STRIPE_PRICE_ID_LIBRARY`）
- [ ] Edge Functionsを再デプロイ
- [ ] テストカードで決済テスト
- [ ] Webhook処理の確認
- [ ] `members`テーブルへの記録確認
- [ ] Google Sheets連携の確認

### reCAPTCHA問題

- [ ] Cloudflare設定の確認
- [ ] 異なるブラウザでテスト
- [ ] 異なるネットワーク環境でテスト
- [ ] Stripeサポートへの問い合わせ（必要に応じて）

---

## 🔧 トラブルシューティング

### 問題: Supabase環境変数が更新されない

**原因**: キャッシュが残っている可能性

**対策**:
```bash
# Edge Functionsを再デプロイ
npx supabase functions deploy create-checkout-session --no-verify-jwt
npx supabase functions deploy stripe-webhook
```

---

### 問題: Stripe Checkoutページが表示されない

**原因**: 環境変数が正しく設定されていない

**対策**:
1. Supabase Dashboard → Edge Functions → `create-checkout-session` → Logs
2. エラーメッセージを確認
3. 環境変数を再確認

---

### 問題: Webhook処理が実行されない

**原因**: Webhook URLが正しく設定されていない

**対策**:
1. Stripe Dashboard → 「開発者」→「Webhook」
2. エンドポイントURLを確認: `https://haaxgwyimoqzzxzdaeep.functions.supabase.co/stripe-webhook`
3. 「テストモード」タブで設定されていることを確認
4. イベントタイプ: `checkout.session.completed`が選択されていることを確認

---

### 問題: Google Sheetsに記録されない

**原因**: Google Sheets APIの認証エラー

**対策**:
1. Supabase Dashboard → Edge Functions → `stripe-webhook` → Logs
2. Google Sheets APIのエラーメッセージを確認
3. `GOOGLE_SHEETS_CREDENTIALS`環境変数を確認
4. サービスアカウントの権限を確認

---

## 📊 修繕後の検証

### 1. APIレベルのテスト

```bash
curl -X POST https://haaxgwyimoqzzxzdaeep.functions.supabase.co/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-verification@example.com",
    "opt_in_email": true,
    "agree_terms": true,
    "agree_privacy": true,
    "tier": "library"
  }'
```

**期待される出力**:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**確認ポイント**:
- ✅ Session IDが`cs_test_`で始まる（テストモード）
- ✅ HTTP 200 OK
- ✅ レスポンスタイム < 500ms

---

### 2. エンドツーエンドテスト

1. フロントエンドから決済フローを完了
2. Success URLに遷移することを確認
3. `members`テーブルにレコードが作成されることを確認
4. Google Sheetsに行が追加されることを確認

---

### 3. パフォーマンステスト

| 項目 | 目標値 | 測定方法 |
|------|--------|----------|
| create-checkout-session | < 500ms | Supabase Dashboard → Functions → Overview |
| stripe-webhook | < 1000ms | Supabase Dashboard → Functions → Overview |
| Google Sheets API | < 2000ms | Edge Function Logs |

---

## 📝 修繕後の報告

修繕完了後、以下の情報を含むレポートを作成してください：

1. **実施した修正内容**
   - 変更した環境変数
   - 再デプロイしたEdge Functions
   - その他の変更

2. **テスト結果**
   - APIレベルのテスト結果
   - エンドツーエンドテスト結果
   - パフォーマンステスト結果

3. **残存する問題**
   - 未解決の問題
   - 今後の対応が必要な項目

4. **推奨事項**
   - 監視体制の構築
   - 定期的なテストの実施
   - ドキュメントの更新

---

## 🔗 関連リソース

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [点検レポート](./PAID_SUBSCRIPTION_INSPECTION_REPORT.md)

---

**作成日**: 2025年12月8日  
**最終更新**: 2025年12月8日
