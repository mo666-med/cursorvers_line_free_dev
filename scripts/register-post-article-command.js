// Discord Slash Commandを登録するスクリプト
// Usage: node scripts/register-post-article-command.js

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const APPLICATION_ID = "1447704583374639165"; // Cursorvers Bot

if (!DISCORD_BOT_TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN is not set");
  process.exit(1);
}

const commands = [
  {
    name: "post-article",
    description: "記事URLをトレンド情報共有チャンネルに投稿",
    options: [
      {
        name: "url",
        description: "投稿する記事のURL",
        type: 3, // STRING
        required: true,
      },
    ],
  },
];

async function registerCommands() {
  const url = `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`;

  for (const command of commands) {
    console.log(`Registering command: ${command.name}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Command registered: ${data.name} (ID: ${data.id})`);
    } else {
      const error = await response.text();
      console.error(`❌ Failed to register command: ${error}`);
    }
  }
}

registerCommands();
