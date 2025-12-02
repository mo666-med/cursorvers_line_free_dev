// supabase/functions/line-webhook/index.ts
// LINE公式アカウント用 Webhook エントリポイント（Pocket Defense Tool）
// - 型定義
// - dispatcher（Prompt Polisher / Risk Checker / 診断キーワード）
// - logInteraction helper
// OpenAI呼び出しや個別ロジックは lib/ 以下に切り出す

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runPromptPolisher } from "./lib/prompt-polisher.ts";
import { runRiskChecker } from "./lib/risk-checker.ts";
import { buildCourseEntryMessage } from "./lib/course-router.ts";

// =======================
// 型定義
// =======================

type DiagnosisKeyword =
  | "病院AIリスク診断"
  | "SaMDスタートアップ診断"
  | "医療データガバナンス診断"
  | "臨床知アセット診断"
  | "教育AI導入診断"
  | "次世代AI実装診断";

type InteractionType = "prompt_polisher" | "risk_checker" | "course_entry";

interface LineUserSource {
  userId?: string;
  type: "user" | "group" | "room" | string;
}

interface LineTextMessage {
  id: string;
  type: "text";
  text: string;
}

interface LinePostback {
  data: string;
}

interface LineEvent {
  type: "message" | "postback" | string;
  replyToken?: string;
  source: LineUserSource;
  message?: LineTextMessage;
  postback?: LinePostback;
}

interface LineWebhookRequestBody {
  destination?: string;
  events: LineEvent[];
}

// =======================
// 環境変数 & クライアント
// =======================

const LINE_CHANNEL_ACCESS_TOKEN =
  Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN") ?? "";
const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const MAX_POLISH_PER_DAY = Number(Deno.env.get("MAX_POLISH_PER_DAY") ?? "5");
const MAX_INPUT_LENGTH = Number(Deno.env.get("MAX_INPUT_LENGTH") ?? "3000");

// Discord コミュニティリンク
const DISCORD_INVITE_URL = "https://discord.gg/hmMz3pHH";

if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_CHANNEL_SECRET) {
  console.warn(
    "[line-webhook] LINE environment variables are not fully set."
  );
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[line-webhook] Supabase environment variables are not fully set."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// =======================
// 共通ヘルパー
// =======================

function bucketLength(len: number | null | undefined): string | null {
  if (len == null) return null;
  if (len <= 100) return "0-100";
  if (len <= 300) return "100-300";
  if (len <= 1000) return "300-1000";
  return "1000+";
}

function normalizeKeyword(raw: string): string {
  // 全角スペース→半角、前後の空白を trim
  return raw.replace(/　/g, " ").trim();
}

const COURSE_KEYWORDS: DiagnosisKeyword[] = [
  "病院AIリスク診断",
  "SaMDスタートアップ診断",
  "医療データガバナンス診断",
  "臨床知アセット診断",
  "教育AI導入診断",
  "次世代AI実装診断",
];

function detectCourseKeyword(text: string): DiagnosisKeyword | null {
  const normalized = normalizeKeyword(text);
  const match = COURSE_KEYWORDS.find((kw) => kw === normalized);
  return (match as DiagnosisKeyword | undefined) ?? null;
}

// LINE 署名検証
async function verifyLineSignature(
  req: Request,
  rawBody: string
): Promise<boolean> {
  if (!LINE_CHANNEL_SECRET) return false;
  const signature = req.headers.get("x-line-signature");
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(LINE_CHANNEL_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const hmac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const hashArray = Array.from(new Uint8Array(hmac));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  return hashBase64 === signature;
}

// クイックリプライアイテムの型
interface QuickReplyItem {
  type: "action";
  action: {
    type: "message" | "postback";
    label: string;
    text?: string;
    data?: string;
  };
}

interface QuickReply {
  items: QuickReplyItem[];
}

// LINE 返信（reply API）
async function replyText(replyToken: string, text: string, quickReply?: QuickReply) {
  if (!replyToken) return;
  const message: Record<string, unknown> = { type: "text", text };
  if (quickReply) {
    message.quickReply = quickReply;
  }
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [message],
    }),
  });
}

// 診断キーワード選択用のクイックリプライを生成
function buildDiagnosisQuickReply(): QuickReply {
  return {
    items: COURSE_KEYWORDS.map((keyword) => ({
      type: "action" as const,
      action: {
        type: "message" as const,
        label: keyword.replace("診断", ""), // ラベルは短く
        text: keyword,
      },
    })),
  };
}

// LINE push（非同期で結果を送る用）
async function pushText(lineUserId: string, text: string) {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text }],
    }),
  });
}

// Supabase users: line_user_id から user.id を解決 or 作成
async function getOrCreateUser(lineUserId: string): Promise<string> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[line-webhook] getOrCreateUser select error", error);
    throw error;
  }

  if (data?.id) return data.id;

  const { data: inserted, error: insertError } = await supabase
    .from("users")
    .insert({ line_user_id: lineUserId })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[line-webhook] getOrCreateUser insert error", insertError);
    throw insertError;
  }

  return inserted.id;
}

// interaction_logs への記録
interface LogOptions {
  userId: string;
  interactionType: InteractionType;
  courseKeyword?: DiagnosisKeyword | null;
  riskFlags?: string[] | null;
  inputLength?: number | null;
}

async function logInteraction(opts: LogOptions) {
  const { userId, interactionType, courseKeyword, riskFlags, inputLength } =
    opts;

  const lengthBucket = bucketLength(inputLength);

  const { error } = await supabase.from("interaction_logs").insert({
    user_id: userId,
    interaction_type: interactionType,
    course_keyword: courseKeyword ?? null,
    risk_flags: riskFlags ?? [],
    length_bucket: lengthBucket,
  });

  if (error) {
    console.error("[line-webhook] logInteraction error", error);
  }
}

// 当日の Prompt Polisher 利用回数をチェック
async function getTodayPolishCount(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const { count, error } = await supabase
    .from("interaction_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("interaction_type", "prompt_polisher")
    .gte("created_at", todayIso);

  if (error) {
    console.error("[line-webhook] getTodayPolishCount error", error);
    return 0;
  }

  return count ?? 0;
}

// =======================
// Dispatcher 本体
// =======================

async function handleEvent(event: LineEvent): Promise<void> {
  const source = event.source;
  const replyToken = event.replyToken;

  // userId がないイベントは対象外（グループ等は当面サポートしない）
  if (!source.userId) return;
  const lineUserId = source.userId;

  // ユーザーを取得 or 新規作成
  const userId = await getOrCreateUser(lineUserId);

  // テキスト取得
  let text: string | null = null;
  if (event.type === "message" && event.message?.type === "text") {
    text = event.message.text;
  } else if (event.type === "postback" && event.postback?.data) {
    text = event.postback.data;
  }

  if (!text) {
    // 非対応イベントには何も返さない
    return;
  }

  const trimmed = text.trim();

  // 1) Prompt Polisher: 「磨いて:」 or 「polish:」
  if (trimmed.startsWith("磨いて:") || trimmed.startsWith("polish:")) {
    const rawInput = trimmed.replace(/^磨いて:|^polish:/, "").trim();

    // 入力長チェック
    if (rawInput.length > MAX_INPUT_LENGTH) {
      if (replyToken) {
        await replyText(
          replyToken,
          `入力が長すぎます（${MAX_INPUT_LENGTH}文字以内にしてください）。\n要約してから再度お試しください。`
        );
      }
      return;
    }

    // 日次利用回数チェック
    const todayCount = await getTodayPolishCount(userId);
    if (todayCount >= MAX_POLISH_PER_DAY) {
      if (replyToken) {
        await replyText(
          replyToken,
          `本日の利用上限（${MAX_POLISH_PER_DAY}回）に達しました。\n明日またお試しください。`
        );
      }
      return;
    }

    if (replyToken) {
      await replyText(
        replyToken,
        "プロンプトを整えています。数秒お待ちください。"
      );
    }

    // 非同期で実際のPolisher処理を実行
    void (async () => {
      try {
        const result = await runPromptPolisher(rawInput);
        if (result.success && result.polishedPrompt) {
          const messageWithDiscord = result.polishedPrompt + 
            "\n\n---\n💬 ご質問・ご相談は Discord で受付中\n" + DISCORD_INVITE_URL;
          await pushText(lineUserId, messageWithDiscord);
        } else {
          await pushText(
            lineUserId,
            result.error ?? "プロンプト整形中にエラーが発生しました。"
          );
        }
      } catch (err) {
        console.error("[line-webhook] prompt_polisher error", err);
        await pushText(
          lineUserId,
          "プロンプト整形中にエラーが発生しました。時間をおいて再度お試しください。"
        );
      }
    })();

    await logInteraction({
      userId,
      interactionType: "prompt_polisher",
      inputLength: rawInput.length,
    });

    return;
  }

  // 2) Risk Checker: 「check:」 or 「チェック:」
  if (trimmed.startsWith("check:") || trimmed.startsWith("チェック:")) {
    const rawInput = trimmed.replace(/^check:|^チェック:/, "").trim();

    // 入力長チェック
    if (rawInput.length > MAX_INPUT_LENGTH) {
      if (replyToken) {
        await replyText(
          replyToken,
          `入力が長すぎます（${MAX_INPUT_LENGTH}文字以内にしてください）。\n要約してから再度お試しください。`
        );
      }
      return;
    }

    if (replyToken) {
      await replyText(
        replyToken,
        "文章のリスクチェックを実行しています。数秒お待ちください。"
      );
    }

    void (async () => {
      try {
        const result = await runRiskChecker(rawInput);
        if (result.success && result.formattedMessage) {
          const messageWithDiscord = result.formattedMessage + 
            "\n\n---\n💬 詳しい相談は Discord で受付中\n" + DISCORD_INVITE_URL;
          await pushText(lineUserId, messageWithDiscord);
          
          // riskFlags を記録（非同期で実行）
          if (result.riskFlags && result.riskFlags.length > 0) {
            await logInteraction({
              userId,
              interactionType: "risk_checker",
              riskFlags: result.riskFlags,
              inputLength: rawInput.length,
            });
          }
        } else {
          await pushText(
            lineUserId,
            result.error ?? "リスクチェック中にエラーが発生しました。"
          );
        }
      } catch (err) {
        console.error("[line-webhook] risk_checker error", err);
        await pushText(
          lineUserId,
          "リスクチェック中にエラーが発生しました。時間をおいて再度お試しください。"
        );
      }
    })();

    // 初回ログ（riskFlags は後から更新される）
    await logInteraction({
      userId,
      interactionType: "risk_checker",
      inputLength: rawInput.length,
    });

    return;
  }

  // 3) 診断キーワード（6種類のいずれかと完全一致）
  const courseKeyword = detectCourseKeyword(trimmed);
  if (courseKeyword) {
    const courseMessage = buildCourseEntryMessage(courseKeyword);
    if (replyToken) {
      await replyText(replyToken, courseMessage);
    }

    await logInteraction({
      userId,
      interactionType: "course_entry",
      courseKeyword,
      inputLength: trimmed.length,
    });

    return;
  }

  // 4) 「コミュニティ」選択 → Discord 招待
  if (trimmed === "コミュニティ") {
    if (replyToken) {
      await replyText(
        replyToken,
        [
          "🎉 Cursorvers コミュニティへようこそ！",
          "",
          "Discord で医療 × AI の最新情報や、",
          "他のメンバーとの交流ができます。",
          "",
          "▼ 参加はこちら",
          DISCORD_INVITE_URL,
        ].join("\n")
      );
    }
    return;
  }

  // 5) それ以外 → ヘルプメッセージ + クイックリプライ
  if (replyToken) {
    const helpMessage = [
      "Pocket Defense Tool",
      "",
      "■ プロンプト整形",
      "雑なメモをAI用の構造化プロンプトに変換します。",
      "",
      "使い方：「磨いて:」の後に文章を入力",
      "例）磨いて:患者の血圧が高いので降圧剤を検討したい",
      "",
      "■ リスクチェック",
      "文章に含まれるリスク（広告規制・個人情報など）を判定します。",
      "",
      "使い方：「check:」の後に文章を入力",
      "例）check:この治療法で必ず治ります",
      "",
      "■ AI導入についての情報収集",
      "下のボタンから関心のあるテーマを選んでください ↓",
    ].join("\n");

    await replyText(replyToken, helpMessage, buildDiagnosisQuickReply());
  }
}

// =======================
// HTTP エントリポイント
// =======================

serve(async (req: Request): Promise<Response> => {
  // GET リクエストは疎通確認用
  if (req.method === "GET") {
    return new Response("OK - line-webhook is running", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();

  // LINE 署名検証
  const valid = await verifyLineSignature(req, rawBody);
  if (!valid) {
    console.error("[line-webhook] Invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  let body: LineWebhookRequestBody;
  try {
    body = JSON.parse(rawBody) as LineWebhookRequestBody;
  } catch (err) {
    console.error("[line-webhook] JSON parse error", err);
    return new Response("Bad Request", { status: 400 });
  }

  const events = body.events ?? [];
  
  // 各イベントは並列で処理（ただしOpenAI部分は非同期キックのみ）
  await Promise.all(events.map((ev) => handleEvent(ev)));

  // replyMessage は handleEvent 内で済ませているので、ここは常に 200 でOK
  return new Response("OK", { status: 200 });
});

