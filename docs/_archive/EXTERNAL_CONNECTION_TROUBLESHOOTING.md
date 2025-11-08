# 外部接続トラブルシューティングガイド

## 問題: Codexが外部接続を拒否している

**問題の本質**: Codex（CursorのAI機能）はfull access権限を持っているはずなのに、外部接続をrejectしている。

このプロジェクトでは、GitHub Actionsから以下の外部APIに接続する必要があります：

- GitHub API（repository_dispatch、contents API等）
- Manus API（`https://api.manus.im`）
- LLM API（OpenAI等）
- Supabase API
- LINE API

## Codexの外部接続設定

### 0. Codexの権限確認と修正

Codexが外部接続を拒否している場合、以下の設定を確認してください：

#### Cursor設定ファイルの確認

```bash
# Cursorの設定ファイルを確認
cat ~/Library/Application\ Support/Cursor/User/settings.json | jq '.["chat.tools.global.autoApprove"]'
```

#### 自動承認設定の確認

Cursorの設定で以下が有効になっているか確認：

```json
{
  "chat.tools.global.autoApprove": true,
  "chat.tools.terminal.autoApprove": {
    "curl": true,
    "bash": true,
    // ... その他のツール
  }
}
```

#### Codexの外部接続を許可する設定

プロジェクトルートに`.cursorrules`ファイルを作成して、外部接続を明示的に許可：

```markdown
# Codex外部接続許可

Codexは以下の外部APIへの接続を許可されています：
- GitHub API
- Manus API
- LLM API（OpenAI等）
- Supabase API
- LINE API

ネットワーク接続や外部APIへのアクセスは、作業に必要な場合に許可してください。
```

## 解決策

### 1. GitHub Actionsの権限設定

GitHub Actionsで外部APIに接続するには、ワークフローファイルに`permissions`設定を追加する必要があります。

```yaml
permissions:
  contents: write      # ファイル作成・更新のため
  actions: write       # 他のワークフローをトリガーするため
  issues: write        # Issue作成のため
  pull-requests: write # PR作成のため
```

**重要**: デフォルトでは、GitHub Actionsは`read-only`権限しか持っていません。外部APIに接続するには、明示的に権限を設定する必要があります。

### 2. GitHub Secretsの設定確認

外部APIに接続するには、適切な認証情報をGitHub Secretsに設定する必要があります：

```bash
# 必要なSecretsを確認
gh secret list

# 不足しているSecretsを追加
gh secret set LLM_ENDPOINT --body "https://api.openai.com/v1/chat/completions"
gh secret set LLM_API_KEY --body "sk-..."
gh secret set MANUS_API_KEY --body "..."
gh secret set SUPABASE_ACCESS_TOKEN --body "..."
```

### 3. GitHub Variablesの設定確認

```bash
# 必要なVariablesを確認
gh variable list

# 不足しているVariablesを追加
gh variable set MANUS_BASE_URL --body "https://api.manus.im"
gh variable set VERIFIED_DOMAIN --body "https://your-verified-domain.jp"
```

### 4. ネットワーク接続の確認

GitHub Actionsランナーから外部APIへの接続を確認：

```bash
# ワークフロー内で接続テスト
curl -X GET https://api.github.com/zen
curl -X GET https://api.manus.im/health
```

### 5. よくある問題と対処法

#### 問題: `403 Forbidden`エラー

**原因**: 権限が不足している、または認証情報が無効

**対処**:
- ワークフローファイルに`permissions`設定を追加
- GitHub Secretsの認証情報を確認・更新

#### 問題: `Connection timeout`エラー

**原因**: ネットワーク接続の問題、またはAPIがダウンしている

**対処**:
- APIの稼働状況を確認
- リトライロジックを実装

#### 問題: `401 Unauthorized`エラー

**原因**: 認証情報が間違っている、またはAPIキーが無効

**対処**:
- GitHub Secretsの認証情報を確認
- 新しいAPIキーを発行して更新

### 6. 権限設定のベストプラクティス

1. **最小権限の原則**: 必要最小限の権限のみを設定
2. **明示的な設定**: `permissions`を明示的に設定して、デフォルトの動作に依存しない
3. **権限の分離**: 各ワークフローに必要な権限のみを設定

### 7. トラブルシューティング手順

1. **ワークフローの実行ログを確認**
   ```bash
   gh run list --workflow=manus-progress.yml
   gh run view <run-id> --log
   ```

2. **Secretsの確認**
   ```bash
   gh secret list
   ```

3. **接続テスト**
   ```bash
   # ワークフロー内でcurlコマンドを使用して接続をテスト
   ```

4. **権限設定の確認**
   - ワークフローファイルに`permissions`設定があるか確認
   - リポジトリの設定で、GitHub Actionsの権限が制限されていないか確認

## 参考リンク

- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
- [GitHub Actions Network](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#networking)
- [Manus API Documentation](https://docs.manus.im)

