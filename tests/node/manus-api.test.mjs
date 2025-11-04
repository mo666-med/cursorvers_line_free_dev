import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPrompt,
  resolveConfig,
  createManusTask,
  getManusTask,
  cancelManusTask,
} from "../../scripts/lib/manus-api.js";

test("buildPrompt stitches brief and plan JSON", () => {
  const prompt = buildPrompt({
    brief: "## Brief",
    plan: { title: "demo" },
  });
  assert.ok(prompt.includes("## Brief"));
  assert.ok(prompt.includes('"title": "demo"'));
});

test("resolveConfig pulls values from overrides and env", () => {
  const env = {
    MANUS_API_KEY: "env-key",
    MANUS_BASE_URL: "https://custom.example/api/",
    PROGRESS_WEBHOOK_URL: "https://example.com/webhook",
  };
  const config = resolveConfig({ baseUrl: "https://override.dev" }, env);
  assert.equal(config.apiKey, "env-key");
  assert.equal(config.baseUrl, "https://override.dev");
  assert.equal(config.webhookUrl, "https://example.com/webhook");
});

test("createManusTask posts prompt payload", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ task_id: "task-123" }), { status: 200 });
  };

  try {
    const result = await createManusTask({
      brief: "Brief text",
      plan: { steps: [] },
      overrides: { apiKey: "key-123", baseUrl: "https://api.test" },
      webhookUrl: "https://hook.example",
      metadata: { source: "test" },
    });
    assert.equal(result.task_id, "task-123");
    assert.equal(calls.length, 1);
    const payload = JSON.parse(calls[0].init.body);
    assert.equal(typeof payload.prompt, "string");
    assert.equal(payload.webhook_url, "https://hook.example");
    assert.deepEqual(payload.metadata, { source: "test" });
    assert.equal(calls[0].init.headers.API_KEY, "key-123");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getManusTask issues GET request", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ task_id: "task-456" }), { status: 200 });
  };

  try {
    const result = await getManusTask("task-456", { apiKey: "k", baseUrl: "https://api.test" });
    assert.equal(result.task_id, "task-456");
    assert.equal(calls[0].init.method, "GET");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("cancelManusTask issues DELETE request", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ status: "cancelled" }), { status: 200 });
  };

  try {
    const result = await cancelManusTask("task-789", { apiKey: "k", baseUrl: "https://api.test" });
    assert.equal(result.status, "cancelled");
    assert.equal(calls[0].init.method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
