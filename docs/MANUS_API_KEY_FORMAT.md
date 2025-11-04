# Manus APIキーの正しい形式

## 📋 エラー分析

エラーメッセージ「invalid token: token is malformed: token contains an invalid number of segments」は、**JWTトークンの形式エラー**を示しています。

## 🔍 JWTトークンの形式

JWT（JSON Web Token）は通常、以下の形式です：

```
header.payload.signature
```

例：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**特徴**:
- 3つの部分が**ドット（.）で区切られている**
- 各部分はbase64urlエンコードされている
- 合計で**2つのドット**が含まれる

## 📋 現在のMANUS_API_KEYの形式

現在の`.env`ファイルの`MANUS_API_KEY`は：
- 長さ: 95文字
- 開始: `sk-`（OpenAI APIキー形式）
- ドットの数: おそらく0個または1個（JWT形式ではない）

**問題**: Manus APIがJWT形式を期待している可能性があります。

## 💡 正しい形式の確認方法

### 1. Manus APIのドキュメントを確認

Manus APIの公式ドキュメントで、APIキーの形式を確認してください：
- https://docs.manus.im
- または、ManusのダッシュボードでAPIキーを確認

### 2. GitHub Secretsの値を確認

GitHub Secretsに保存されている`MANUS_API_KEY`の実際の値を確認：

```bash
gh secret get MANUS_API_KEY
```

### 3. コードでの使用例

`scripts/lib/manus-api.js`では、以下のように使用されています：

```javascript
headers: {
  'Authorization': `Bearer ${MANUS_API_KEY}`,
  ...
}
```

**重要**: `Bearer `プレフィックスが自動的に追加されるため、`MANUS_API_KEY`には`Bearer `を含めないでください。

## 🔧 確認すべきポイント

1. **JWT形式かどうか**
   - ドット（.）が2つ含まれているか
   - 3つの部分（header.payload.signature）で構成されているか

2. **余分な文字がないか**
   - 先頭/末尾のスペース
   - 改行文字
   - 引用符（`"` や `'`）

3. **正しい値を取得しているか**
   - GitHub Secretsから正しい値を取得できているか
   - Manusのダッシュボードから正しいAPIキーを取得しているか

## 📝 正しい形式の例

### JWT形式の場合

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### シンプルな文字列形式の場合

```
manus_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🔍 現在の値の確認

```bash
# .envファイルのMANUS_API_KEYの値を確認（ドットの数を確認）
MANUS_KEY=$(grep "^MANUS_API_KEY=" .env | cut -d'=' -f2-)
echo "ドットの数: $(echo "$MANUS_KEY" | grep -o '\.' | wc -l | tr -d ' ')個"

# JWT形式かどうか確認
if echo "$MANUS_KEY" | grep -qE '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'; then
  echo "✅ JWT形式です"
else
  echo "⚠️  JWT形式ではありません"
fi
```

## 💡 次のステップ

1. **ManusのダッシュボードでAPIキーを確認**
   - https://manus.im または Manusの管理画面
   - APIキーの形式を確認

2. **GitHub Secretsの値を確認**
   ```bash
   gh auth login
   gh secret get MANUS_API_KEY
   ```

3. **正しい値を.envに設定**
   ```bash
   # 正しい値を取得して設定
   MANUS_API_KEY_VALUE=$(gh secret get MANUS_API_KEY | grep -v '^Warning:' | head -1)
   # .envファイルを更新
   sed -i.bak "s|^MANUS_API_KEY=.*|MANUS_API_KEY=$MANUS_API_KEY_VALUE|" .env
   ```

4. **再度テスト実行**
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
