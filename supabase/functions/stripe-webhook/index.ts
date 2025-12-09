// @ts-nocheck
/// <reference types="https://deno.land/std@0.168.0/types.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { notifyDiscord } from "../_shared/alert.ts";

// Google Sheets 連携（任意）
const MEMBERS_SHEET_ID = Deno.env.get("MEMBERS_SHEET_ID") ?? "";
const MEMBERS_SHEET_TAB = Deno.env.get("MEMBERS_SHEET_TAB") ?? "members";
const GOOGLE_SA_JSON = Deno.env.get("GOOGLE_SA_JSON") ?? "";

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Google Sheets連携関数
async function buildSheetsClient(serviceAccount: any) {
  const now = Math.floor(Date.now() / 1000);
  const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const jwtPayload = btoa(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://www.googleapis.com/oauth2/v4/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "pkcs8",
    strToUint8Array(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(`${jwtHeader}.${jwtPayload}`),
  );
  const jwtSignature = uint8ToBase64(signature);

  const tokenResponse = await fetch("https://www.googleapis.com/oauth2/v4/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${jwtHeader}.${jwtPayload}.${jwtSignature}`,
    }),
  }).then((res) => res.json());

  if (!tokenResponse.access_token) {
    throw new Error("Failed to obtain Google access token");
  }

  const authHeaders = {
    Authorization: `Bearer ${tokenResponse.access_token}`,
    "Content-Type": "application/json",
  };

  return {
    async append(tabName: string, values: unknown[][]) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${MEMBERS_SHEET_ID}/values/${tabName}!A2:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ values }),
        },
      );
    },
  };
}

async function appendMemberRow(row: unknown[]) {
  if (!MEMBERS_SHEET_ID || !GOOGLE_SA_JSON) {
    console.log("Google Sheets not configured, skipping append");
    return;
  }
  try {
    const client = await buildSheetsClient(JSON.parse(GOOGLE_SA_JSON));
    await client.append(MEMBERS_SHEET_TAB, [row]);
    console.log(`Appended member to sheet: ${MEMBERS_SHEET_TAB}`);
  } catch (err) {
    console.warn("Failed to append to sheet:", err instanceof Error ? err.message : String(err));
  }
}

function strToUint8Array(pem: string) {
  const cleaned = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const binary = atob(cleaned);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function uint8ToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

// Discord招待リンクを送信
async function sendDiscordInvite(email: string, name: string | null, tier: string) {
  const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
  const discordRoleId = Deno.env.get("DISCORD_ROLE_ID");
  const guildId = Deno.env.get("DISCORD_GUILD_ID") || "1316621823382728704"; // Cursorvers Discord Server ID

  if (!discordBotToken) {
    console.warn("DISCORD_BOT_TOKEN not set, skipping Discord invite");
    return;
  }

  try {
    // Discord招待リンクを生成（有効期限2週間、使用回数1回）
    const inviteResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/invites`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${discordBotToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          max_age: 1209600, // 2週間（14日）
          max_uses: 1, // 1回のみ使用可能
          unique: true,
        }),
      }
    );

    if (!inviteResponse.ok) {
      const errorText = await inviteResponse.text();
      console.error(`Failed to create Discord invite: ${inviteResponse.status} ${errorText}`);
      await notifyDiscord({
        title: "MANUS ALERT: Discord invite creation failed",
        message: `Status: ${inviteResponse.status}, Error: ${errorText}`,
        context: { email, tier },
      });
      return;
    }

    const invite = await inviteResponse.json();
    const inviteUrl = `https://discord.gg/${invite.code}`;

    console.log(`Discord invite created: ${inviteUrl} for ${email}`);

    // 招待リンクをメールで送信（実装例）
    // TODO: メール送信機能を実装
    console.log(`TODO: Send email to ${email} with invite link: ${inviteUrl}`);

    // Discordに通知（管理者用）
    await notifyDiscord({
      title: "🎉 New Member Joined!",
      message: `**Email**: ${email}\n**Name**: ${name || "N/A"}\n**Tier**: ${tier}\n**Invite**: ${inviteUrl}`,
    });
  } catch (err) {
    console.error(`Failed to send Discord invite: ${err.message}`);
    await notifyDiscord({
      title: "MANUS ALERT: Discord invite error",
      message: err.message,
      context: { email, tier },
    });
  }
}

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret!,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    await notifyDiscord({
      title: "MANUS ALERT: Stripe webhook signature failed",
      message: err.message,
    });
    return new Response(err.message, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email;
      const paymentStatus = session.payment_status;
      const mode = session.mode;

      console.log(`Checkout session completed: ${session.id}, email: ${customerEmail}, status: ${paymentStatus}, mode: ${mode}`);

      // Payment Linkからの決済完了のみ処理（payment_statusがpaidの場合）
      if (customerEmail && paymentStatus === "paid") {
        // サブスクリプション情報を取得
        const subscriptionId = session.subscription as string | null;
        let subscriptionStatus = "active";
        let nextBillingAt: string | null = null;
        let membershipTier = "library"; // デフォルトはLibrary Member
        let stripeSubscriptionId: string | null = null;
        const optInEmail =
          (session.metadata?.opt_in_email ?? "").toString().toLowerCase() ===
          "true";

        // 顧客名を取得
        const customerName = session.customer_details?.name || null;

        // サブスクリプション型の場合、詳細情報を取得
        if (subscriptionId && typeof subscriptionId === "string") {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionStatus = subscription.status;
            stripeSubscriptionId = subscription.id;
            nextBillingAt = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null;
            console.log(`Subscription details: ${subscriptionId}, status: ${subscriptionStatus}`);
          } catch (err) {
            console.error(`Failed to retrieve subscription: ${err.message}`);
          }
        }

        // Payment Linkのメタデータからサービス種別を判定
        // Master Classは¥380,000（税抜）= 380000円（最小通貨単位）
        if (session.amount_total && session.amount_total >= 380000) {
          membershipTier = "master";
        }
        
        // Payment Link IDからも判定（URLの末尾部分）
        const paymentLinkId = session.payment_link;
        if (paymentLinkId && typeof paymentLinkId === "string") {
          if (paymentLinkId.includes("5kQaEXavbc9T63SfB34F201")) {
            membershipTier = "master";
          }
        }

        const { error } = await supabase
          .from("members")
          .upsert(
            {
              email: customerEmail,
              name: customerName,
              stripe_customer_id: session.customer as string | null,
              stripe_subscription_id: stripeSubscriptionId,
              status: "active",
              stripe_subscription_status: subscriptionStatus,
              tier: membershipTier,
              period_end: nextBillingAt,
              opt_in_email: optInEmail,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );

        if (error) {
          console.error("DB Insert Error:", error);
          await notifyDiscord({
            title: "MANUS ALERT: members upsert failed",
            message: error.message ?? "unknown DB error",
            context: { email: customerEmail, membershipTier, subscriptionId },
          });
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        } else {
          console.log(`Member joined: ${customerEmail}, tier: ${membershipTier}`);
          
          // Google Sheets へ追記（設定されている場合のみ）
          await appendMemberRow([
            customerEmail ?? "",
            customerName ?? "",
            membershipTier ?? "",
            "active",
            nextBillingAt ?? "",
            optInEmail,
            "", // line_user_id（Stripe決済時は未設定）
            new Date().toISOString(),
          ]);

          // Discord招待リンクを送信
          await sendDiscordInvite(customerEmail, customerName, membershipTier);
        }
      } else {
        console.log(`Payment not completed: email=${customerEmail}, status=${paymentStatus}`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      let customerEmail: string | null = null;

      // Customerオブジェクトからemailを取得
      if (typeof subscription.customer === "string") {
        try {
          const customer = await stripe.customers.retrieve(subscription.customer);
          if (customer && !customer.deleted) {
            customerEmail = customer.email || null;
          }
        } catch (err) {
          console.error(`Failed to retrieve customer: ${err.message}`);
        }
      }

      if (customerEmail) {
        const { error } = await supabase
          .from("members")
          .update({
            stripe_subscription_status: subscription.status,
            status: subscription.status === "canceled" ? "inactive" : "active",
            period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq("email", customerEmail);

        if (error) console.error("DB Update Error:", error);
        else console.log(`Subscription updated: ${subscription.id}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      let customerEmail: string | null = null;

      // Customerオブジェクトからemailを取得
      if (typeof subscription.customer === "string") {
        try {
          const customer = await stripe.customers.retrieve(subscription.customer);
          if (customer && !customer.deleted) {
            customerEmail = customer.email || null;
          }
        } catch (err) {
          console.error(`Failed to retrieve customer: ${err.message}`);
        }
      }

      if (customerEmail) {
        const { error } = await supabase
          .from("members")
          .update({
            stripe_subscription_status: "canceled",
            status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("email", customerEmail);

        if (error) console.error("DB Update Error:", error);
        else console.log(`Subscription canceled: ${subscription.id}`);
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
