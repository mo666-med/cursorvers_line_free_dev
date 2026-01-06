/**
 * Gmail → Discord 転送スクリプト
 *
 * 設定手順:
 * 1. https://script.google.com/ にアクセス
 * 2. 新しいプロジェクトを作成
 * 3. このコードを貼り付け
 * 4. DISCORD_WEBHOOK_URL を設定
 * 5. トリガーを設定（5分ごとなど）
 */

// Discord Webhook URL
const DISCORD_WEBHOOK_URL = '';

// 処理済みメールを記録するプロパティキー
const PROCESSED_KEY = 'processedEmails';

// 監視対象のラベル（空の場合は受信トレイ）
const TARGET_LABEL = '';

// 送信元フィルター（空の場合は全件）
const FROM_FILTER = '';

// 検索クエリ（未読メールのみ）
const SEARCH_QUERY = 'is:unread';

const MAX_THREADS = 20;

function buildSearchQuery() {
  const parts = [];
  if (TARGET_LABEL) {
    parts.push(`label:${TARGET_LABEL}`);
  }
  if (FROM_FILTER) {
    parts.push(`from:${FROM_FILTER}`);
  }
  if (SEARCH_QUERY) {
    parts.push(SEARCH_QUERY);
  }
  return parts.join(' ');
}

function getWebhookUrl() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('DISCORD_WEBHOOK_URL') || DISCORD_WEBHOOK_URL;
}

/**
 * メイン関数 - トリガーから呼び出される
 */
function checkNewEmails() {
  try {
    const query = buildSearchQuery();
    const threads = GmailApp.search(query, 0, MAX_THREADS);
    const processedIds = getProcessedIds();

    for (const thread of threads) {
      const messages = thread.getMessages();

      for (const message of messages) {
        const messageId = message.getId();

        // 既に処理済みならスキップ
        if (processedIds.includes(messageId)) {
          continue;
        }

        // Discord に送信
        if (sendToDiscord(message)) {
          // 処理済みとして記録
          processedIds.push(messageId);
          message.markRead();
        }
      }
    }

    // 処理済みIDを保存（最新100件のみ保持）
    saveProcessedIds(processedIds.slice(-100));

  } catch (error) {
    console.error('Error in checkNewEmails:', error);
    // エラーも Discord に通知
    sendErrorToDiscord(error);
  }
}

/**
 * Discord にメールを送信
 */
function sendToDiscord(message) {
  const from = message.getFrom();
  const subject = message.getSubject();
  const date = message.getDate();
  const snippet = message.getPlainBody().substring(0, 500);
  const webhookUrl = getWebhookUrl();

  if (!webhookUrl) {
    console.error('Discord webhook URL is not set');
    return false;
  }

  const embed = {
    title: `📧 ${subject}`,
    description: snippet + (message.getPlainBody().length > 500 ? '...' : ''),
    color: 0x4285f4, // Gmail blue
    fields: [
      {
        name: '送信者',
        value: from,
        inline: true
      },
      {
        name: '受信日時',
        value: Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'),
        inline: true
      }
    ],
    footer: {
      text: 'Gmail → Discord 転送'
    },
    timestamp: date.toISOString()
  };

  const payload = {
    username: 'Gmail Notifier',
    embeds: [embed]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(webhookUrl, options);
  const status = response.getResponseCode();

  if (status !== 200 && status !== 204) {
    console.error('Discord API error:', response.getContentText());
    return false;
  }

  return true;
}

/**
 * エラーを Discord に送信
 */
function sendErrorToDiscord(error) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.error('Discord webhook URL is not set');
    return;
  }
  const payload = {
    username: 'Gmail Notifier',
    content: `⚠️ **エラー発生**\n\`\`\`${error.toString()}\`\`\``
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(webhookUrl, options);
}

/**
 * 処理済みメールIDを取得
 */
function getProcessedIds() {
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty(PROCESSED_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * 処理済みメールIDを保存
 */
function saveProcessedIds(ids) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(PROCESSED_KEY, JSON.stringify(ids));
}

/**
 * 手動テスト用
 */
function testSendToDiscord() {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.error('Discord webhook URL is not set');
    return;
  }
  const payload = {
    username: 'Gmail Notifier',
    content: '✅ Gmail → Discord 転送テスト成功！'
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(webhookUrl, options);
  console.log('Response:', response.getResponseCode(), response.getContentText());
}

/**
 * トリガーを設定
 */
function createTrigger() {
  // 既存のトリガーを削除
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'checkNewEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // 5分ごとに実行するトリガーを作成
  ScriptApp.newTrigger('checkNewEmails')
    .timeBased()
    .everyMinutes(5)
    .create();

  console.log('Trigger created: checkNewEmails every 5 minutes');
}
