# Supabase設定手順

## Supabaseプロジェクト情報

- **Project URL**: `https://haaxgwyimoqzzxzdaeep.supabase.co`
- **Project Reference**: `haaxgwyimoqzzxzdaeep`

## 設定すべき内容

### 1. GitHub Secrets（機密情報）

```bash
# SupabaseのAPIキー（anon keyまたはservice_role key）
gh secret set SUPABASE_KEY --body "your-supabase-anon-key"

# または、service_role keyを使用する場合
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "your-supabase-service-role-key"

# 進捗Webhook URL（Manusから進捗を受け取るURL）
gh secret set PROGRESS_WEBHOOK_URL --body "https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay"
```

### 2. GitHub Variables（公開情報）

```bash
# SupabaseのURL（公開情報）
gh variable set SUPABASE_URL --body "https://haaxgwyimoqzzxzdaeep.supabase.co"
```

## コードでの使用方法

### GitHub Actionsワークフロー内

```yaml
- name: Use Supabase
  env:
    SUPABASE_URL: ${{ vars.SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
  run: |
    # Supabaseクライアントを使用
    node -e "
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);
      // 使用例
    "
```

### Node.jsスクリプトでの使用例

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://haaxgwyimoqzzxzdaeep.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)
```

## Supabase APIキーの取得方法

1. Supabase Dashboardにログイン
2. プロジェクトを選択
3. Settings → API に移動
4. **anon/public key** または **service_role key** をコピー

**注意**: 
- `anon key`: フロントエンドで使用（Row Level Securityが適用される）
- `service_role key`: バックエンドで使用（RLSをバイパス、注意して使用）

## 設定後の確認

```bash
# Secretsの確認
gh secret list | grep SUPABASE

# Variablesの確認
gh variable list | grep SUPABASE
```

## 必要なSecrets/Variables一覧

### 必須
- ✅ `SUPABASE_URL` (Variables)
- ✅ `SUPABASE_KEY` (Secrets)
- ✅ `PROGRESS_WEBHOOK_URL` (Secrets) - `https://haaxgwyimoqzzxzdaeep.supabase.co/functions/v1/relay`

### オプション
- `SUPABASE_SERVICE_ROLE_KEY` (Secrets) - サーバーサイドで使用する場合

