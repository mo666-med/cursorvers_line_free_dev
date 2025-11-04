# Manus APIタスクIDの確認

## 📋 タスクID

```
13beb19a-768b-48b4-92f4-e916b3ca1efd
```

## ✅ タスクIDの形式

- **形式**: UUID形式（ハイフン区切り）
- **長さ**: 36文字
- **パターン**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## 📋 タスク情報の取得方法

### コマンドラインから取得

```bash
# 環境変数を設定
export MANUS_API_KEY="your-manus-api-key"
export MANUS_BASE_URL="https://api.manus.im"

# タスク情報を取得
node scripts/manus-api.js get 13beb19a-768b-48b4-92f4-e916b3ca1efd
```

### MCPから取得

Cursor IDEのチャット画面で：
```
@manus-api get 13beb19a-768b-48b4-92f4-e916b3ca1efd
```

## 📋 このタスクIDの意味

このタスクIDは、以下のいずれかの場合に取得できます：

1. **Manus APIへのタスク作成が成功した場合**
   - `POST /v1/tasks`のレスポンスに含まれる`task_id`
   - タスクが正常に作成されたことを示す

2. **Manusのダッシュボードから取得**
   - Manusの管理画面で確認できるタスクID
   - 実行中のタスクや過去のタスクのID

## ⚠️ 現在のエラー

```
invalid token: token is malformed: token contains an invalid number of segments
```

このエラーは、Manus APIキーの形式が正しくないことを示しています。

## 💡 解決方法

1. **正しいManus APIキーを設定**
   - `.cursor/manus-config.json`を更新
   - または`.env`ファイルを更新

2. **環境変数を読み込み**
   ```bash
   source .env
   ```

3. **再度タスク情報を取得**
   ```bash
   node scripts/manus-api.js get 13beb19a-768b-48b4-92f4-e916b3ca1efd
   ```

## 📚 参考資料

- `docs/MANUS_API_KEY_FORMAT.md`: APIキーの形式について
- `docs/MANUS_API_KEY_EVALUATION.md`: APIキーの評価結果
- `scripts/manus-api.js`: CLIツールの実装

