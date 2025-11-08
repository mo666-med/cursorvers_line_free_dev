# Manus APIキーの評価結果

## 📋 提供されたAPIキーの評価

### キー情報
```
sk-tF3nImDcsAP5McOSmpNvXIjR92PZWkhNmAvqKBD1rNqAajItOKlIUa1d6pbWhHcLG_bJbqFhOWtQcEJEY5PSB1jN_aRY
```

### 形式分析

✅ **基本情報**:
- 長さ: 95文字
- 開始: `sk-`
- 形式: OpenAI APIキーの形式（`sk-`で始まる）
- ドットの数: 0個
- 有効な文字: 英数字、アンダースコア、ハイフンのみ

❌ **問題点**:
- JWT形式ではない（ドットが0個）
- Manus APIが期待する形式と異なる可能性

### エラー分析

エラーメッセージ: `invalid token: token is malformed: token contains an invalid number of segments`

このエラーは：
- JWTトークンの形式エラーを示している
- JWT形式では、3つの部分（header.payload.signature）がドット（.）で区切られている必要がある
- 提供されたキーにはドットが含まれていない

# Manus APIキーの評価結果

## 📋 提供されたAPIキーの評価

### キー情報
```
sk-tF3nImDcsAP5McOSmpNvXIjR92PZWkhNmAvqKBD1rNqAajItOKlIUa1d6pbWhHcLG_bJbqFhOWtQcEJEY5PSB1jN_aRY
```

**注意**: このキーはManusのダッシュボードで作成されたものです。

### 形式分析

✅ **基本情報**:
- 長さ: 95文字
- 開始: `sk-`
- 形式: OpenAI APIキーの形式（`sk-`で始まる）
- ドットの数: 0個
- 有効な文字: 英数字、アンダースコア、ハイフンのみ

❌ **問題点**:
- JWT形式ではない（ドットが0個）
- Manus APIが期待する形式と異なる可能性

### エラー分析

エラーメッセージ: `invalid token: token is malformed: token contains an invalid number of segments`

このエラーは：
- JWTトークンの形式エラーを示している
- JWT形式では、3つの部分（header.payload.signature）がドット（.）で区切られている必要がある
- 提供されたキーにはドットが含まれていない

### 可能性

1. **Manus APIがJWT形式を期待している可能性**
   - エラーメッセージから、JWT形式（ドット2つを含む）を期待している可能性が高い
   - しかし、Manusのダッシュボードで生成したキーがJWT形式ではない

2. **Manusのダッシュボードで生成したキーが正しい形式ではない可能性**
   - Manusのダッシュボードで生成したキーが、実際にはOpenAI APIキーの形式になっている可能性
   - または、Manus APIが異なる形式のキーを期待している可能性

3. **Manus APIの実装が変更された可能性**
   - Manus APIの実装が変更され、JWT形式を要求するようになった可能性
   - しかし、ダッシュボードで生成されるキーがJWT形式ではない

### 確認すべきこと

1. **ManusのダッシュボードでAPIキーの形式を確認**
   - Manusのダッシュボードで、生成されたAPIキーの形式を確認
   - JWT形式かどうか確認
   - または、シンプルな文字列形式かどうか確認

2. **Manus APIのドキュメントを確認**
   - https://docs.manus.im または https://manus-ai.com/api-docs
   - APIキーの正しい形式を確認
   - 認証方法の詳細を確認

3. **Manusのサポートに問い合わせ**
   - APIキーの形式について確認
   - エラーメッセージの意味を確認
   - 正しい形式のAPIキーを取得する方法を確認

### テスト結果

提供されたAPIキーを`.env`ファイルに設定してテストしましたが、同じエラーが発生しました：

```
❌ Error: Manus API error: 401 {"code":16, "message":"invalid token: token is malformed: token contains an invalid number of segments", "details":[]}
```

### 推奨される対応

1. **ManusのダッシュボードでAPIキーの形式を確認**
   - Manusのダッシュボードで、生成されたAPIキーの形式を確認
   - JWT形式（ドット2つを含む）かどうか確認

2. **Manus APIのドキュメントを確認**
   - https://docs.manus.im または https://manus-ai.com/api-docs
   - APIキーの正しい形式を確認

3. **Manusのサポートに問い合わせ**
   - APIキーの形式について確認
   - エラーメッセージの意味を確認

4. **GitHub Actionsから実行（代替方法）**
   - GitHub Actionsのワークフロー（`manus-task-runner.yml`）を使用すると、GitHub Secretsが自動的に参照されるため、この問題が発生しない可能性があります

## 📚 参考資料

- Manus APIドキュメント: https://docs.manus.im
- Manus API Docs: https://manus-ai.com/api-docs
- JWT形式について: https://jwt.io/introduction

### 確認すべきこと

1. **このキーがManus APIキーかどうか**
   - Manusのダッシュボードから正しいAPIキーを取得
   - APIキーの形式を確認

2. **Manus APIのドキュメント**
   - Manus APIの公式ドキュメントで、APIキーの形式を確認
   - 認証方法の詳細を確認

3. **GitHub Secretsの値**
   - GitHub Secretsに保存されている`MANUS_API_KEY`が正しいか確認
   - Manusのダッシュボードから取得した値と一致するか確認

### テスト結果

提供されたAPIキーを`.env`ファイルに設定してテストしましたが、同じエラーが発生しました：

```
❌ Error: Manus API error: 401 {"code":16, "message":"invalid token: token is malformed: token contains an invalid number of segments", "details":[]}
```

### 推奨される対応

1. **ManusのダッシュボードでAPIキーを確認**
   - https://manus.im または Manusの管理画面にアクセス
   - APIキーのセクションを確認
   - 正しいAPIキーを取得

2. **APIキーの形式を確認**
   - JWT形式（ドット2つを含む）かどうか
   - シンプルな文字列形式かどうか
   - その他の形式かどうか

3. **GitHub Secretsを更新**
   ```bash
   gh secret set MANUS_API_KEY --body "正しいManus APIキー"
   ```

4. **再度テスト**
   ```bash
   source .env
node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
  orchestration/plan/current_plan.json \
  --webhook "$PROGRESS_WEBHOOK_URL"
   ```

## 📚 参考資料

- Manus APIドキュメント: https://docs.manus.im
- JWT形式について: https://jwt.io/introduction
