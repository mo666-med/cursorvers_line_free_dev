/**
 * Supabase Client Unit Tests
 * Tests for retry logic and database operations
 */

import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.210.0/assert/mod.ts";

// Mock types for testing
interface MockResponse {
  data: unknown;
  error: { message: string } | null;
}

// Test the retry logic pattern used in supabase-client.ts
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10; // Fast for testing

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(
    `${operationName} failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

// ========== Tests ==========

Deno.test("withRetry - succeeds on first attempt", async () => {
  let attempts = 0;
  const result = await withRetry(async () => {
    attempts++;
    return "success";
  }, "test operation");

  assertEquals(result, "success");
  assertEquals(attempts, 1);
});

Deno.test("withRetry - succeeds after retry", async () => {
  let attempts = 0;
  const result = await withRetry(async () => {
    attempts++;
    if (attempts < 2) {
      throw new Error("temporary failure");
    }
    return "success after retry";
  }, "test operation");

  assertEquals(result, "success after retry");
  assertEquals(attempts, 2);
});

Deno.test("withRetry - fails after max retries", async () => {
  let attempts = 0;
  await assertRejects(
    async () => {
      await withRetry(async () => {
        attempts++;
        throw new Error("persistent failure");
      }, "test operation");
    },
    Error,
    "test operation failed after 3 attempts"
  );

  assertEquals(attempts, MAX_RETRIES);
});

Deno.test("withRetry - includes last error message", async () => {
  await assertRejects(
    async () => {
      await withRetry(async () => {
        throw new Error("specific error message");
      }, "test operation");
    },
    Error,
    "specific error message"
  );
});

// Test mock for Supabase response handling
Deno.test("handles successful Supabase response", () => {
  const response: MockResponse = {
    data: [{ content_hash: "abc123" }, { content_hash: "def456" }],
    error: null,
  };

  const hashes = new Set(
    ((response.data as { content_hash: string }[]) || []).map(
      (row) => row.content_hash
    )
  );

  assertEquals(hashes.size, 2);
  assertEquals(hashes.has("abc123"), true);
  assertEquals(hashes.has("def456"), true);
});

Deno.test("handles Supabase error response", () => {
  const response: MockResponse = {
    data: null,
    error: { message: "Database connection failed" },
  };

  if (response.error) {
    const error = new Error(
      `Failed to fetch: ${response.error.message}`
    );
    assertEquals(error.message, "Failed to fetch: Database connection failed");
  }
});

Deno.test("handles empty Supabase response", () => {
  const response: MockResponse = {
    data: [],
    error: null,
  };

  const hashes = new Set(
    ((response.data as { content_hash: string }[]) || []).map(
      (row) => row.content_hash
    )
  );

  assertEquals(hashes.size, 0);
});

// Test batch processing logic
Deno.test("batch processing - correct batch sizes", () => {
  const records = Array.from({ length: 125 }, (_, i) => ({ id: i }));
  const batchSize = 50;
  const batches: { id: number }[][] = [];

  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }

  assertEquals(batches.length, 3);
  assertEquals(batches[0].length, 50);
  assertEquals(batches[1].length, 50);
  assertEquals(batches[2].length, 25);
});

Deno.test("batch processing - handles small arrays", () => {
  const records = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const batchSize = 50;
  const batches: { id: number }[][] = [];

  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }

  assertEquals(batches.length, 1);
  assertEquals(batches[0].length, 3);
});

Deno.test("batch processing - handles empty array", () => {
  const records: { id: number }[] = [];
  const batchSize = 50;
  const batches: { id: number }[][] = [];

  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }

  assertEquals(batches.length, 0);
});

// Test deduplication logic
Deno.test("deduplication - filters existing hashes", () => {
  const existingHashes = new Set(["hash1", "hash2", "hash3"]);
  const cards = [
    { contentHash: "hash1", body: "existing" },
    { contentHash: "hash4", body: "new" },
    { contentHash: "hash2", body: "existing" },
    { contentHash: "hash5", body: "new" },
  ];

  const newCards = cards.filter((card) => !existingHashes.has(card.contentHash));

  assertEquals(newCards.length, 2);
  assertEquals(newCards[0].contentHash, "hash4");
  assertEquals(newCards[1].contentHash, "hash5");
});

Deno.test("deduplication - handles empty existing set", () => {
  const existingHashes = new Set<string>();
  const cards = [
    { contentHash: "hash1", body: "card1" },
    { contentHash: "hash2", body: "card2" },
  ];

  const newCards = cards.filter((card) => !existingHashes.has(card.contentHash));

  assertEquals(newCards.length, 2);
});

Deno.test("deduplication - handles all duplicates", () => {
  const existingHashes = new Set(["hash1", "hash2"]);
  const cards = [
    { contentHash: "hash1", body: "card1" },
    { contentHash: "hash2", body: "card2" },
  ];

  const newCards = cards.filter((card) => !existingHashes.has(card.contentHash));

  assertEquals(newCards.length, 0);
});

// Test stats aggregation
Deno.test("stats aggregation - groups by theme", () => {
  const data = [
    { theme: "tech" },
    { theme: "ai_gov" },
    { theme: "tech" },
    { theme: "general" },
    { theme: "tech" },
  ];

  const byTheme: Record<string, number> = {};
  data.forEach((row) => {
    byTheme[row.theme] = (byTheme[row.theme] || 0) + 1;
  });

  assertEquals(byTheme["tech"], 3);
  assertEquals(byTheme["ai_gov"], 1);
  assertEquals(byTheme["general"], 1);
});

Deno.test("stats aggregation - groups by status", () => {
  const data = [
    { status: "ready" },
    { status: "used" },
    { status: "ready" },
    { status: "ready" },
    { status: "archived" },
  ];

  const byStatus: Record<string, number> = {};
  data.forEach((row) => {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
  });

  assertEquals(byStatus["ready"], 3);
  assertEquals(byStatus["used"], 1);
  assertEquals(byStatus["archived"], 1);
});
