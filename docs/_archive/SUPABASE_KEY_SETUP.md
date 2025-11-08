# Supabase APIキーの設定

## 現在の設定状況

### ✅ 設定済み
- `SUPABASE_URL`: `https://haaxgwyimoqzzxzdaeep.supabase.co` (Variables)
- `PROGRESS_WEBHOOK_URL`: `https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay` (Secrets)
- `MANUS_API_KEY` (Secrets)

### ⚠️ 未設定（要設定）
- `SUPABASE_KEY` (Secrets) - Supabase APIキー

## Supabase APIキーの取得方法

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard
   - プロジェクト `haaxgwyimoqzzxzdaeep` を選択

2. **Settings → API に移動**

3. **APIキーをコピー**
   - **anon/public key**: フロントエンド用（推奨）
   - **service_role key**: バックエンド用（RLSをバイパス、注意）

## 設定コマンド

```bash
# Supabase APIキーを設定
gh secret set SUPABASE_KEY --body "your-supabase-anon-key-here"
```

**注意**: `your-supabase-anon-key-here` を実際のSupabase APIキーに置き換えてください。

## 設定後の確認

```bash
# Secretsの確認
gh secret list

# Variablesの確認
gh variable list
```

## コードでの使用例

### GitHub Actionsワークフロー内

```yaml
- name: Use Supabase
  env:
    SUPABASE_URL: ${{ vars.SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
  run: |
    node scripts/your-script.js
```

### Node.jsスクリプト

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://haaxgwyimoqzzxzdaeep.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)
```

## 完了後の次のステップ

1. ✅ `SUPABASE_KEY`を設定
2. ワークフローでSupabaseクライアントを使用できるようになります
3. Manus APIとの連動が可能になります

