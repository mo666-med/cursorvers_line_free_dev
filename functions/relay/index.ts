// Front Door: Webhook relay for LINE and Manus Progress events.
// Handles signature verification, payload sanitization, dedupe caching, and
// dispatching to GitHub repository_dispatch.

import { createHash, createHmac } from "https://deno.land/std@0.224.0/node/crypto.ts";
import type { KvClient } from "./kv.ts";
import { getKv } from "./kv.ts";

interface RelayEnv {
  GH_OWNER: string;
  GH_REPO: string;
  GH_PAT: string;
  LINE_CHANNEL_SECRET?: string;
  MANUS_API_KEY?: string;
  HASH_SALT?: string;
  FEATURE_BOT_ENABLED?: string;
  DEDUPE_TTL_SECONDS?: string;
}

type EventType = "line_event" | "manus_progress" | "unknown";

const DEFAULT_DEDUPE_TTL = 120; // seconds
const memoryDedupeCache = new Map<string, number>();

function log(level: "info" | "warn" | "error", message: string, meta: Record<string, unknown> = {}) {
  const entry = { level, message, ...meta };
  console[level === "error" ? "error" : "log"](JSON.stringify(entry));
}

export function verifySignature(body: string, signature: string | null, env: RelayEnv): boolean {
  if (!signature) return false;

  // LINE sends a base64 encoded HMAC without prefix.
  const normalizedSig = signature.replace(/^sha256=/i, "");
  if (env.LINE_CHANNEL_SECRET) {
    try {
      const hash = createHmac("sha256", env.LINE_CHANNEL_SECRET).update(body).digest("base64");
      if (hash === normalizedSig) {
        return true;
      }
    } catch (error) {
      log("warn", "Failed to compute LINE signature", { error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (signature.startsWith("Bearer ") && env.MANUS_API_KEY) {
    return signature.substring("Bearer ".length) === env.MANUS_API_KEY;
  }

  return false;
}

export function hashUserId(userId: string, salt?: string): string {
  const resolvedSalt = salt ?? "";
  const hash = createHash("sha256");
  hash.update(resolvedSalt);
  hash.update(":");
  hash.update(userId ?? "");
  return hash.digest("hex").slice(0, 16);
}

export function sanitizePayload(payload: unknown, eventType: EventType, env: RelayEnv) {
  if (eventType === "manus_progress" && typeof payload === "object" && payload) {
    const data = payload as Record<string, unknown>;
    return {
      progress_id: data.progress_id ?? data.task_id ?? null,
      decision: data.decision ?? data.plan_delta?.decision ?? "unknown",
      plan_variant: data.plan_variant ?? data.context?.plan_variant ?? "production",
      retry_after_seconds: data.retry_after_seconds ?? data.plan_delta?.retry_after_seconds ?? null,
      manus_points_consumed: data.manus_points_consumed ?? data.metrics?.manus_points ?? null,
      metadata: {
        step_id: data.step_id ?? null,
        event_type: data.event_type ?? null,
        manus_run_id: data.manus_run_id ?? null,
        context: data.context ?? null,
        preview: data.preview ?? null,
        error: data.error ?? null,
      },
    };
  }

  if (eventType === "line_event" && typeof payload === "object" && payload) {
    const redact = (env as Record<string, string | undefined>).REDACT_LINE_MESSAGE === "true";
    const salt = env.HASH_SALT ?? "";
    const data = payload as { destination?: string; events?: Array<Record<string, unknown>> };

    return {
      destination: data.destination ?? null,
      events: (data.events ?? []).map((event) => {
        const source = event.source as { type?: string; userId?: string } | undefined;
        const hashedId = source?.userId ? hashUserId(source.userId, salt) : null;
        const message = event.message as { type?: string; id?: string; text?: string } | undefined;
        return {
          type: event.type ?? "unknown",
          timestamp: event.timestamp ?? null,
          source: {
            type: source?.type ?? "unknown",
            userId: hashedId,
          },
          replyToken: event.replyToken ?? null,
          message: message
            ? {
                type: message.type ?? null,
                id: message.id ?? null,
                text: redact ? "[redacted]" : message.text ?? null,
              }
            : null,
        };
      }),
    };
  }

  return payload;
}

export function createDedupKey(
  eventType: EventType,
  payload: unknown,
  env: RelayEnv,
  signature: string | null,
  rawBody: string,
): string {
  const hash = createHash("sha256");
  hash.update(eventType);

  if (eventType === "line_event" && payload && typeof payload === "object") {
    const data = payload as { events?: Array<Record<string, unknown>> };
    const salt = env.HASH_SALT ?? "";
    const event = data.events?.[0] ?? {};
    const source = event.source as { userId?: string } | undefined;
    const message = event.message as { id?: string } | undefined;
    hash.update(hashUserId(source?.userId ?? "unknown", salt));
    hash.update("|");
    hash.update(String(event.type ?? "unknown"));
    hash.update("|");
    hash.update(String(event.timestamp ?? ""));
    hash.update("|");
    hash.update(String(message?.id ?? ""));
    hash.update("|");
    hash.update(String(event.replyToken ?? ""));
    return hash.digest("hex");
  }

  if (eventType === "manus_progress" && payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    hash.update(String(data.progress_id ?? data.task_id ?? "unknown"));
    hash.update("|");
    hash.update(String(data.decision ?? data.plan_delta?.decision ?? "unknown"));
    hash.update("|");
    hash.update(String(data.plan_variant ?? data.context?.plan_variant ?? "production"));
    hash.update("|");
    hash.update(String(data.step_id ?? ""));
    return hash.digest("hex");
  }

  hash.update(signature ?? "");
  hash.update("|");
  hash.update(rawBody);
  return hash.digest("hex");
}

export async function markEventAsSeen(
  key: string,
  ttlSeconds: number,
  kvFactory?: () => Promise<KvClient | null>,
): Promise<boolean> {
  const now = Date.now();
  const expiry = now + ttlSeconds * 1000;
  const factory = kvFactory ?? defaultKvFactory;
  const kv = await factory();

  if (kv) {
    const existing = await kv.get<boolean>(["dedupe", key]);
    if (existing?.value === true && existing.expiration && existing.expiration > now) {
      return false;
    }
    await kv.set(["dedupe", key], true, { expireIn: ttlSeconds * 1000 });
    return true;
  }

  const current = memoryDedupeCache.get(key);
  if (current && current > now) {
    return false;
  }
  memoryDedupeCache.set(key, expiry);
  return true;
}

async function defaultKvFactory(): Promise<KvClient | null> {
  try {
    return await getKv();
  } catch (error) {
    log("warn", "Unable to open KV store", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

function detectEventType(payload: unknown): EventType {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if (Array.isArray(data.events)) return "line_event";
    if (data.progress_id || data.event_type || data.task_id) return "manus_progress";
  }
  return "unknown";
}

function resolveDedupeTtl(env: RelayEnv): number {
  const parsed = Number(env.DEDUPE_TTL_SECONDS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_DEDUPE_TTL;
}

export default {
  async fetch(req: Request, env: RelayEnv): Promise<Response> {
    if (env.FEATURE_BOT_ENABLED === "false") {
      log("warn", "Front Door disabled via FEATURE_BOT_ENABLED");
      return new Response(JSON.stringify({ error: "bot_disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("X-Line-Signature") ?? req.headers.get("Authorization");
    const rawBody = await req.text();

    if (!verifySignature(rawBody, signature, env)) {
      log("warn", "Signature verification failed", { hasSignature: Boolean(signature) });
      return new Response(JSON.stringify({ error: "signature_invalid" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    let payload: unknown;
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch (error) {
      log("error", "Failed to parse JSON payload", { error: error instanceof Error ? error.message : String(error) });
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const eventType = detectEventType(payload);
    if (eventType === "unknown") {
      log("warn", "Unknown event type received", { sample: rawBody.slice(0, 128) });
      return new Response(JSON.stringify({ error: "unsupported_event" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dedupeKey = createDedupKey(eventType, payload, env, signature, rawBody);
    const ttl = resolveDedupeTtl(env);
    const isFresh = await markEventAsSeen(dedupeKey, ttl);

    if (!isFresh) {
      log("info", "Duplicate event suppressed", { eventType, dedupeKey });
      return new Response(JSON.stringify({ status: "duplicate" }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sanitized = sanitizePayload(payload, eventType, env);
    log("info", "Dispatching event to GitHub", { eventType, dedupeKey });

    const response = await fetch(
      `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GH_PAT}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: eventType,
          client_payload: sanitized,
          dedupe_key: dedupeKey,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      log("error", "GitHub dispatch failed", { status: response.status, text: text.slice(0, 256) });
      return new Response(JSON.stringify({ error: "dispatch_failed", status: response.status }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "ok", event_type: eventType }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};

export const __testOnly = {
  clearMemoryDedupeCache() {
    memoryDedupeCache.clear();
  },
  memoryCacheSize() {
    return memoryDedupeCache.size;
  },
};
