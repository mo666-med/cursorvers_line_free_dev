import {
  assert,
  assertEquals,
  assertFalse,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHmac } from "https://deno.land/std@0.224.0/node/crypto.ts";
import { FakeTime } from "https://deno.land/std@0.224.0/testing/time.ts";
import {
  __testOnly,
  createDedupKey,
  hashUserId,
  markEventAsSeen,
  sanitizePayload,
  verifySignature,
} from "./index.ts";

const BASE_ENV = {
  GH_OWNER: "owner",
  GH_REPO: "repo",
  GH_PAT: "pat",
} as const;

Deno.test("verifySignature validates LINE signatures (base64 HMAC)", () => {
  const body = JSON.stringify({ hello: "world" });
  const secret = "test-line-secret";
  const signature = createHmac("sha256", secret).update(body).digest("base64");

  const env = {
    ...BASE_ENV,
    LINE_CHANNEL_SECRET: secret,
  };

  assert(
    verifySignature(body, signature, env),
    "Expected LINE signature to be valid"
  );
});

Deno.test("verifySignature rejects invalid LINE signatures", () => {
  const body = JSON.stringify({ hello: "world" });
  const secret = "test-line-secret";
  const env = {
    ...BASE_ENV,
    LINE_CHANNEL_SECRET: secret,
  };

  assertFalse(
    verifySignature(body, "invalid-signature", env),
    "Expected invalid signature to be rejected"
  );
});

Deno.test("verifySignature checks Manus bearer token", () => {
  const env = {
    ...BASE_ENV,
    MANUS_API_KEY: "manus-token",
  };

  assert(
    verifySignature("{}", "Bearer manus-token", env),
    "Expected valid Manus token to pass verification"
  );
  assertFalse(
    verifySignature("{}", "Bearer other-token", env),
    "Expected mismatched Manus token to fail"
  );
});

Deno.test("hashUserId generates deterministic truncated hash", () => {
  const first = hashUserId("user-123");
  const second = hashUserId("user-123");
  assertEquals(first, second);
  assertEquals(first.length, 16);
});

Deno.test("hashUserId supports salting", () => {
  const salted = hashUserId("user-123", "salt");
  const unsalted = hashUserId("user-123");
  assertFalse(
    salted === unsalted,
    "Salted hash should differ from unsalted hash"
  );
});

Deno.test("sanitizePayload redacts LINE message text when configured", () => {
  const payload = {
    destination: "bot",
    events: [
      {
        type: "message",
        timestamp: 1700000000000,
        source: { type: "user", userId: "U123" },
        replyToken: "reply-token",
        message: { type: "text", id: "mid", text: "hello world" },
      },
    ],
  };

  const env = {
    ...BASE_ENV,
    HASH_SALT: "pepper",
    REDACT_LINE_MESSAGE: "true",
  };

  const sanitized = sanitizePayload(payload, "line_event", env);
  assertEquals(
    sanitized.events[0].message?.text,
    "[redacted]",
  );
  assertEquals(
    sanitized.events[0].source.userId.length,
    16,
  );
});

Deno.test("createDedupKey is stable for identical events and differentiates changes", () => {
  const payload = {
    destination: "bot",
    events: [
      {
        type: "message",
        timestamp: 1700000000000,
        source: { type: "user", userId: "U123" },
        replyToken: "reply-token",
        message: { type: "text", id: "mid", text: "hello world" },
      },
    ],
  };

  const env = {
    ...BASE_ENV,
    HASH_SALT: "pepper",
  };

  const body = JSON.stringify(payload);
  const firstKey = createDedupKey(
    "line_event",
    payload,
    env,
    "signature",
    body,
  );
  const secondKey = createDedupKey(
    "line_event",
    payload,
    env,
    "signature",
    body,
  );
  assertEquals(firstKey, secondKey);

  const modifiedPayload = structuredClone(payload);
  modifiedPayload.events[0].message.id = "mid-2";
  const thirdKey = createDedupKey(
    "line_event",
    modifiedPayload,
    env,
    "signature",
    JSON.stringify(modifiedPayload),
  );
  assertNotEquals(firstKey, thirdKey);
});

Deno.test("markEventAsSeen prevents duplicates and respects TTL expiry", async () => {
  __testOnly.clearMemoryDedupeCache();
  const kvFactory = () => Promise.resolve(null);

  assert(await markEventAsSeen("demo-key", 60, kvFactory));
  assertFalse(await markEventAsSeen("demo-key", 60, kvFactory));

  __testOnly.clearMemoryDedupeCache();
  const fakeTime = new FakeTime();
  try {
    assert(await markEventAsSeen("ttl-key", 1, kvFactory));
    assertFalse(await markEventAsSeen("ttl-key", 1, kvFactory));
    fakeTime.tick(1000);
    assert(await markEventAsSeen("ttl-key", 1, kvFactory));
  } finally {
    fakeTime.restore();
    __testOnly.clearMemoryDedupeCache();
  }
});
