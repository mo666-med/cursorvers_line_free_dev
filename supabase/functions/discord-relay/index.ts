/**
 * Discord Relay Function
 * n8n からの投稿を正しいチャンネルにルーティング
 *
 * エンドポイント:
 * - POST /x-posts: X投稿 → #ownerのつぶやき
 * - POST /cybersecurity: サイバーセキュリティ → #サイバーセキュリティレポート
 */

const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") ?? "";

// チャンネルID
const CHANNELS = {
  OWNER_TWEETS: "1444566050711801957", // ☎-ownerのつぶやき
  CYBERSECURITY: "1443611660894998748", // 📘-サイバーセキュリティレポート
};

async function sendToChannel(
  channelId: string,
  content?: string,
  embeds?: unknown[],
): Promise<Response> {
  if (!DISCORD_BOT_TOKEN) {
    return new Response(JSON.stringify({ error: "Missing bot token" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, embeds }),
    },
  );

  const data = await res.json();
  if (!res.ok) {
    return new Response(JSON.stringify({ error: data }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      message_id: data.id,
      channel_id: data.channel_id,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // POST /x-posts: X投稿 → #ownerのつぶやき
  if (url.pathname.endsWith("/x-posts")) {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { content, embeds, text, url: postUrl, author } = body;

    // n8n からのフォーマットに対応
    let message = content;
    if (!message && text) {
      message = `📱 **${author || "X投稿"}**\n${text}`;
      if (postUrl) {
        message += `\n🔗 ${postUrl}`;
      }
    }

    return await sendToChannel(CHANNELS.OWNER_TWEETS, message, embeds);
  }

  // POST /cybersecurity: サイバーセキュリティ → #サイバーセキュリティレポート
  if (url.pathname.endsWith("/cybersecurity")) {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { content, embeds, subject, snippet, from } = body;

    // Gmail からのフォーマットに対応
    let message = content;
    if (!message && subject) {
      message = `🔐 **${subject}**\n`;
      if (from) {
        message += `📧 From: ${from}\n`;
      }
      if (snippet) {
        message += `\n${snippet}`;
      }
    }

    return await sendToChannel(CHANNELS.CYBERSECURITY, message, embeds);
  }

  // ヘルスチェック
  if (url.pathname.endsWith("/health")) {
    return new Response(
      JSON.stringify({
        status: "ok",
        channels: CHANNELS,
        endpoints: ["/x-posts", "/cybersecurity"],
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      error: "Not found",
      available_endpoints: ["/x-posts", "/cybersecurity", "/health"],
    }),
    { status: 404, headers: { "Content-Type": "application/json" } },
  );
});
