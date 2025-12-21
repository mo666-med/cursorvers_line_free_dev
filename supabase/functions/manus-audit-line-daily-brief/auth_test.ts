/**
 * Manus Audit 認証モジュールテスト
 */
import { assertEquals } from "std-assert";
import { verifyAuth } from "./auth.ts";

// Mock Request helper
function createMockRequest(headers: Record<string, string>): Request {
  return new Request("https://example.com/audit", {
    method: "POST",
    headers: new Headers(headers),
  });
}

Deno.test("auth - verifyAuth", async (t) => {
  const config = {
    apiKey: "test-api-key",
    serviceRoleKey: "test-service-role-key",
  };

  await t.step("returns true with valid X-API-Key header", () => {
    const req = createMockRequest({ "X-API-Key": "test-api-key" });
    assertEquals(verifyAuth(req, config), true);
  });

  await t.step("returns true with valid Bearer token", () => {
    const req = createMockRequest({
      Authorization: "Bearer test-service-role-key",
    });
    assertEquals(verifyAuth(req, config), true);
  });

  await t.step("returns false with invalid X-API-Key", () => {
    const req = createMockRequest({ "X-API-Key": "wrong-key" });
    assertEquals(verifyAuth(req, config), false);
  });

  await t.step("returns false with invalid Bearer token", () => {
    const req = createMockRequest({ Authorization: "Bearer wrong-token" });
    assertEquals(verifyAuth(req, config), false);
  });

  await t.step("returns false with no auth headers", () => {
    const req = createMockRequest({});
    assertEquals(verifyAuth(req, config), false);
  });

  await t.step("returns false with malformed Authorization header", () => {
    const req = createMockRequest({ Authorization: "Basic abc123" });
    assertEquals(verifyAuth(req, config), false);
  });

  await t.step("returns false with empty Bearer token", () => {
    const req = createMockRequest({ Authorization: "Bearer " });
    assertEquals(verifyAuth(req, config), false);
  });

  await t.step("works without apiKey configured (Bearer only)", () => {
    const configNoApiKey = {
      serviceRoleKey: "test-service-role-key",
    };
    const req = createMockRequest({
      Authorization: "Bearer test-service-role-key",
    });
    assertEquals(verifyAuth(req, configNoApiKey), true);
  });

  await t.step("X-API-Key fails when not configured", () => {
    const configNoApiKey = {
      serviceRoleKey: "test-service-role-key",
    };
    const req = createMockRequest({ "X-API-Key": "any-key" });
    assertEquals(verifyAuth(req, configNoApiKey), false);
  });
});
