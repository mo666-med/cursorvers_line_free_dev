#!/usr/bin/env node
/**
 * LINE Official Account 設定取得スクリプト
 * Manus API を使用して LINE Manager から設定を取得
 *
 * Usage:
 *   MANUS_API_KEY=xxx node scripts/fetch-line-settings.js welcome-message
 *   MANUS_API_KEY=xxx node scripts/fetch-line-settings.js rich-menu
 *   MANUS_API_KEY=xxx node scripts/fetch-line-settings.js auto-response
 *
 * Environment:
 *   MANUS_API_KEY - Manus API キー (必須)
 *   MANUS_BASE_URL - Manus API URL (デフォルト: https://api.manus.ai)
 *   LINE_ACCOUNT_ID - LINE アカウントID (デフォルト: @529ybhfo)
 */

const fs = require("fs");
const https = require("https");
const path = require("path");

// Configuration
const MANUS_API_KEY = process.env.MANUS_API_KEY || "";
const MANUS_BASE_URL = process.env.MANUS_BASE_URL || "https://api.manus.ai";
const LINE_ACCOUNT_ID = process.env.LINE_ACCOUNT_ID || "@529ybhfo";
const LINE_MANAGER_BASE = `https://manager.line.biz/account/${LINE_ACCOUNT_ID}`;

// Output directory
const CONFIG_DIR = path.join(__dirname, "..", "config", "line");

/**
 * Make HTTP request
 */
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Create Manus task for LINE settings extraction
 */
async function createExtractionTask(settingType) {
  if (!MANUS_API_KEY) {
    console.error("Error: MANUS_API_KEY environment variable is not set");
    console.error("Usage: MANUS_API_KEY=xxx node scripts/fetch-line-settings.js <setting-type>");
    process.exit(1);
  }

  const prompts = {
    "welcome-message": {
      url: `${LINE_MANAGER_BASE}/autoresponse/welcome`,
      prompt: `# LINE ウェルカムメッセージ設定の取得

## タスク
LINE Official Account Manager にログインし、あいさつメッセージの設定を取得してください。

## 対象URL
${LINE_MANAGER_BASE}/autoresponse/welcome

## 取得する情報
1. メッセージ有効/無効
2. 送信条件（初回のみ/毎回）
3. メッセージ本文（テキスト）
4. 使用されている絵文字や変数（{友だちの表示名} など）

## 出力形式
以下のJSON形式で出力してください:

\`\`\`json
{
  "enabled": true,
  "sendOnlyOnFirstAdd": false,
  "messages": [
    {
      "type": "text",
      "text": "メッセージ内容"
    }
  ],
  "extractedAt": "2025-12-21T00:00:00Z"
}
\`\`\`

## 注意事項
- ログイン情報は LINE 側で認証済みのセッションを使用
- 設定を変更しないでください（読み取りのみ）
`,
    },
    "rich-menu": {
      url: `${LINE_MANAGER_BASE}/richmenu`,
      prompt: `# LINE リッチメニュー設定の取得

## タスク
LINE Official Account Manager にログインし、リッチメニューの設定を取得してください。

## 対象URL
${LINE_MANAGER_BASE}/richmenu

## 取得する情報
1. メニュー名
2. 各ボタンのラベルとアクション
3. デフォルトメニューかどうか
4. 表示期間

## 出力形式
JSON形式で出力してください。
`,
    },
    "auto-response": {
      url: `${LINE_MANAGER_BASE}/autoresponse`,
      prompt: `# LINE 自動応答設定の取得

## タスク
LINE Official Account Manager にログインし、自動応答の設定を取得してください。

## 対象URL
${LINE_MANAGER_BASE}/autoresponse

## 取得する情報
1. 応答モード（Bot / チャット / 両方）
2. キーワード応答の設定
3. AI応答の設定

## 出力形式
JSON形式で出力してください。
`,
    },
  };

  const setting = prompts[settingType];
  if (!setting) {
    console.error(`Unknown setting type: ${settingType}`);
    console.error(`Available types: ${Object.keys(prompts).join(", ")}`);
    process.exit(1);
  }

  console.log(`Creating Manus task for: ${settingType}`);
  console.log(`Target URL: ${setting.url}`);

  const response = await makeRequest(`${MANUS_BASE_URL}/v1/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      API_KEY: MANUS_API_KEY,
    },
    body: JSON.stringify({
      prompt: setting.prompt,
      agentProfile: "manus-1.6",
      taskMode: "agent",
      locale: "ja",
      hideInTaskList: false,
      createShareableLink: true,
    }),
  });

  if (response.statusCode !== 200 && response.statusCode !== 201) {
    console.error(`API Error: ${response.statusCode}`);
    console.error(response.body);
    process.exit(1);
  }

  const data = JSON.parse(response.body);
  console.log("\n✅ Manus task created successfully!");
  console.log(`   Task ID: ${data.task_id}`);
  console.log(`   Task URL: ${data.task_url}`);
  if (data.share_url) {
    console.log(`   Share URL: ${data.share_url}`);
  }

  console.log("\n📋 Next steps:");
  console.log("   1. Manus がタスクを実行するのを待ちます");
  console.log("   2. 完了後、出力された JSON を取得");
  console.log(`   3. config/line/${settingType}.json に保存`);

  return data;
}

/**
 * Display help
 */
function showHelp() {
  console.log(`
LINE Official Account 設定取得スクリプト

Usage:
  MANUS_API_KEY=xxx node scripts/fetch-line-settings.js <setting-type>

Setting Types:
  welcome-message  あいさつメッセージ設定
  rich-menu        リッチメニュー設定
  auto-response    自動応答設定

Environment Variables:
  MANUS_API_KEY    Manus API キー (必須)
  MANUS_BASE_URL   Manus API URL (デフォルト: https://api.manus.ai)
  LINE_ACCOUNT_ID  LINE アカウントID (デフォルト: @529ybhfo)

Examples:
  # ウェルカムメッセージ設定を取得
  MANUS_API_KEY=xxx node scripts/fetch-line-settings.js welcome-message

  # リッチメニュー設定を取得
  MANUS_API_KEY=xxx node scripts/fetch-line-settings.js rich-menu
`);
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const settingType = args[0];

  if (!settingType || settingType === "--help" || settingType === "-h") {
    showHelp();
    process.exit(0);
  }

  try {
    await createExtractionTask(settingType);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
