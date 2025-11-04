# Codex → Manus API 呼び出し検証結果

## ⚠️ 重要な制限事項

**Codex環境の制限**:
- Codex環境では**外部ネットワーク自体が遮断されている**
- 実際に`api.manus.ai`へは到達できず`getaddrinfo ENOTFOUND`エラーとなる
- これは設計上の制限であり、セキュリティ上の理由によるもの

**解決策**:
- **MCP経由**: CursorのMCP（Model Context Protocol）を使用
- **GitHub Actions経由**: GitHub Actionsなどネットワーク許可のある経路から実行
- **ローカル環境**: ユーザーのローカルマシンから直接実行

## 🔍 検証内容

ターミナル選択範囲（658-714行）で報告された問題の検証：

1. **環境変数の読み込み問題**
2. **ネットワーク接続問題（DNS解決エラー）**
3. **Codex環境からの外部API呼び出し制限**

## ✅ 検証結果

### 1. 環境変数の設定状況

- ✅ `.env`ファイルは存在
- ✅ MANUS関連の環境変数が設定されている
  - `MANUS_API_KEY`: 設定済み（95文字）
  - `MANUS_BASE_URL`: `https://api.manus.ai`
  - `PROGRESS_WEBHOOK_URL`: 設定済み

### 2. 環境変数の読み込み方法

**方法1: `set -a && source .env`**
- ✅ 成功: 環境変数が正しく読み込まれる

**方法2: `export $(grep -v '^#' .env | xargs)`**
- ✅ 成功: 環境変数が正しく読み込まれる

**問題点**:
- Node.jsスクリプト（`scripts/manus-api.js`）は`process.env`から環境変数を読み込む
- シェルで`export`した環境変数は、Node.jsプロセスに引き継がれる
- しかし、Codexがターミナルコマンドを実行する際、環境変数が引き継がれない可能性がある

### 3. ネットワーク接続状況

**DNS解決**:
- ✅ `api.manus.ai`は解決可能
  - IPアドレス: `98.89.253.5`, `52.21.78.145`, `34.237.79.211`

**HTTPS接続**:
- ❌ **Codex環境からは外部ネットワークへの接続が遮断されている**
- Codex環境では`getaddrinfo ENOTFOUND`エラーが発生する
- これは設計上の制限であり、セキュリティ上の理由によるもの

**実際のAPI呼び出しについて**:
- ⚠️ Codex環境から直接実行することは**できない**
- MCPやGitHub Actionsなど、ネットワーク許可のある経路から実行する必要がある

### 4. 実際のAPI呼び出しテスト

**Codex環境の制限**:
- ❌ **Codex環境からは外部ネットワークへの接続が遮断されている**
- `getaddrinfo ENOTFOUND api.manus.ai`エラーが発生する
- これは設計上の制限であり、セキュリティ上の理由によるもの

**解決策**:
- ✅ **MCP経由**: CursorのMCP（Model Context Protocol）を使用
- ✅ **GitHub Actions経由**: GitHub Actionsなどネットワーク許可のある経路から実行
- ✅ **ローカル環境**: ユーザーのローカルマシンから直接実行

## 🔍 問題の原因分析

### 問題1: 環境変数の読み込み失敗

**症状**: `MANUS_API_KEY environment variable is required`

**原因**:
- Codexがターミナルコマンドを実行する際、`.env`ファイルから自動的に環境変数を読み込まない
- `node scripts/manus-api.js`を実行する前に、明示的に環境変数を`export`する必要がある

**解決策**:
```bash
# 環境変数を明示的に読み込んでから実行
set -a && source .env && node scripts/manus-api.js create ...
```

### 問題2: Codex環境の外部ネットワーク制限

**症状**: `getaddrinfo ENOTFOUND api.manus.ai`

**原因**:
- **Codex環境では外部ネットワーク自体が遮断されている**
- これは設計上の制限であり、セキュリティ上の理由によるもの
- `.env`を明示的に読み込んでも、ネットワーク接続自体が遮断されているため到達できない

**解決策**:
1. **MCP経由で実行**（推奨）
   - CursorのMCP（Model Context Protocol）を使用
   - MCPサーバーが外部ネットワークにアクセス可能な環境で実行される

2. **GitHub Actions経由で実行**（推奨）
   - GitHub Actions上では外部ネットワークへの接続が可能
   - GitHub Secretsを自動的に参照できる

3. **ローカル環境で実行**
   - ユーザーのローカルマシンから直接実行
   - 環境変数を設定してから実行

## 💡 推奨される解決策

### 1. 環境変数の明示的な読み込み

```bash
# 必ず環境変数を読み込んでから実行
set -a && source .env && node scripts/manus-api.js create \
  orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
  orchestration/plan/current_plan.json \
  --webhook "$PROGRESS_WEBHOOK_URL"
```

### 2. GitHub Actions経由で実行（推奨）

```yaml
# .github/workflows/manus-task-runner.yml
- name: Create Manus Task
  env:
    MANUS_API_KEY: ${{ secrets.MANUS_API_KEY }}
    MANUS_BASE_URL: ${{ vars.MANUS_BASE_URL }}
    PROGRESS_WEBHOOK_URL: ${{ secrets.PROGRESS_WEBHOOK_URL }}
  run: |
    node scripts/manus-api.js create \
      orchestration/MANUS_EXECUTION_BRIEF_costaware.txt \
      orchestration/plan/current_plan.json \
      --webhook "$PROGRESS_WEBHOOK_URL"
```

### 3. スクリプトの改善

`scripts/manus-api.js`を改善して、`.env`ファイルを自動的に読み込むようにする：

```javascript
// scripts/manus-api.js の先頭に追加
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .envファイルを読み込んで環境変数に設定
try {
  const envContent = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  // .envファイルが存在しない場合は無視
}
```

## 📋 結論

### 検証結果のまとめ

1. ✅ **環境変数は正しく設定されている**
   - `.env`ファイルにMANUS関連の環境変数が設定済み

2. ✅ **環境変数の読み込み方法は有効**
   - `set -a && source .env`で環境変数を読み込める

3. ❌ **Codex環境からの外部ネットワーク接続は遮断されている**
   - DNS解決は可能だが、HTTPS接続は遮断されている
   - `getaddrinfo ENOTFOUND api.manus.ai`エラーが発生する
   - これは設計上の制限であり、セキュリティ上の理由によるもの

4. ✅ **解決策は存在**
   - MCP経由で実行（推奨）
   - GitHub Actions経由で実行（推奨）
   - ローカル環境で実行

**結論**: Codex環境から直接Manus APIを呼び出すことはできません。MCPやGitHub Actionsなど、ネットワーク許可のある経路から実行する必要があります。

### 推奨される対応

1. **MCP経由で実行**（推奨）
   - CursorのMCP（Model Context Protocol）を使用
   - `.cursor/mcp.json`でMCPサーバーを設定
   - MCPサーバーが外部ネットワークにアクセス可能な環境で実行される

2. **GitHub Actions経由で実行**（推奨）
   - 外部ネットワークへの接続が確実に可能
   - GitHub Secretsを自動的に参照できる
   - `.github/workflows/manus-task-runner.yml`を使用

3. **ローカル環境で実行**
   - ユーザーのローカルマシンから直接実行
   - 環境変数を設定してから実行
   ```bash
   set -a && source .env && node scripts/manus-api.js create ...
   ```

4. **スクリプトの改善**
   - `.env`ファイルを自動的に読み込む機能を追加（ローカル環境用）

## 📚 関連ドキュメント

- `docs/CURSOR_MANUS_REMOTE_CONTROL.md`: CursorからManus APIを呼び出す方法
- `docs/MANUS_ENV_SETUP.md`: Manus API環境変数の設定方法
- `docs/CODEX_MANUS_OPERATION_GUIDE.md`: Codex → Manus 操作指示書
