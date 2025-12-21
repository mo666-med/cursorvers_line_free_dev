/**
 * LINE Webhook ユーティリティテスト
 */
import { assertEquals } from "std-assert";
import {
  bucketLength,
  calculateWaitMinutes,
  detectCourseKeyword,
  isCancelCommand,
  isEmailFormat,
  isWithinInputLimit,
  normalizeEmail,
  normalizeKeyword,
  parsePolishCommand,
  parseRiskCheckCommand,
} from "./webhook-utils.ts";

Deno.test("webhook-utils - bucketLength", async (t) => {
  await t.step("returns null for null/undefined", () => {
    assertEquals(bucketLength(null), null);
    assertEquals(bucketLength(undefined), null);
  });

  await t.step("returns '0-100' for 0-100", () => {
    assertEquals(bucketLength(0), "0-100");
    assertEquals(bucketLength(50), "0-100");
    assertEquals(bucketLength(100), "0-100");
  });

  await t.step("returns '100-300' for 101-300", () => {
    assertEquals(bucketLength(101), "100-300");
    assertEquals(bucketLength(200), "100-300");
    assertEquals(bucketLength(300), "100-300");
  });

  await t.step("returns '300-1000' for 301-1000", () => {
    assertEquals(bucketLength(301), "300-1000");
    assertEquals(bucketLength(500), "300-1000");
    assertEquals(bucketLength(1000), "300-1000");
  });

  await t.step("returns '1000+' for > 1000", () => {
    assertEquals(bucketLength(1001), "1000+");
    assertEquals(bucketLength(5000), "1000+");
  });
});

Deno.test("webhook-utils - normalizeKeyword", async (t) => {
  await t.step("replaces full-width space with half-width", () => {
    assertEquals(normalizeKeyword("AI　導入"), "AI 導入");
    assertEquals(normalizeKeyword("医療　AI　活用"), "医療 AI 活用");
  });

  await t.step("trims whitespace", () => {
    assertEquals(normalizeKeyword("  test  "), "test");
    assertEquals(normalizeKeyword("　test　"), "test");
  });

  await t.step("handles mixed spaces", () => {
    assertEquals(normalizeKeyword("  AI　導入  "), "AI 導入");
  });
});

Deno.test("webhook-utils - isEmailFormat", async (t) => {
  await t.step("returns true for valid emails", () => {
    assertEquals(isEmailFormat("test@example.com"), true);
    assertEquals(isEmailFormat("user.name@domain.co.jp"), true);
    assertEquals(isEmailFormat("user+tag@gmail.com"), true);
  });

  await t.step("returns false for invalid emails", () => {
    assertEquals(isEmailFormat("notanemail"), false);
    assertEquals(isEmailFormat("missing@domain"), false);
    assertEquals(isEmailFormat("@nodomain.com"), false);
    assertEquals(isEmailFormat(""), false);
  });

  await t.step("handles whitespace", () => {
    assertEquals(isEmailFormat("  test@example.com  "), true);
  });
});

Deno.test("webhook-utils - normalizeEmail", async (t) => {
  await t.step("trims and lowercases", () => {
    assertEquals(normalizeEmail("  TEST@EXAMPLE.COM  "), "test@example.com");
    assertEquals(normalizeEmail("User@Domain.CO.JP"), "user@domain.co.jp");
  });
});

Deno.test("webhook-utils - detectCourseKeyword", async (t) => {
  await t.step("detects known keywords", () => {
    assertEquals(detectCourseKeyword("病院AIリスク診断"), "病院AIリスク診断");
    assertEquals(detectCourseKeyword("クイック診断"), "クイック診断");
    assertEquals(
      detectCourseKeyword("SaMDスタートアップ診断"),
      "SaMDスタートアップ診断",
    );
  });

  await t.step("handles full-width spaces in surrounding", () => {
    // 前後のスペースをトリム
    const result = detectCourseKeyword("　クイック診断　");
    assertEquals(result, "クイック診断");
  });

  await t.step("returns null for unknown keywords", () => {
    assertEquals(detectCourseKeyword("unknown"), null);
    assertEquals(detectCourseKeyword("random text"), null);
    assertEquals(detectCourseKeyword("AI導入"), null); // 存在しないキーワード
  });
});

Deno.test("webhook-utils - calculateWaitMinutes", async (t) => {
  await t.step("returns default for null", () => {
    assertEquals(calculateWaitMinutes(null), 60);
    assertEquals(calculateWaitMinutes(null, 30), 30);
  });

  await t.step("calculates minutes from future date", () => {
    const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const result = calculateWaitMinutes(futureDate);
    // Should be approximately 30 (allow for test execution time)
    assertEquals(result >= 29 && result <= 31, true);
  });

  await t.step("returns minimum 1 minute for past date", () => {
    const pastDate = new Date(Date.now() - 60000); // 1 minute ago
    assertEquals(calculateWaitMinutes(pastDate), 1);
  });
});

Deno.test("webhook-utils - isWithinInputLimit", async (t) => {
  await t.step("returns true for input within limit", () => {
    assertEquals(isWithinInputLimit("short", 100), true);
    assertEquals(isWithinInputLimit("a".repeat(100), 100), true);
  });

  await t.step("returns false for input exceeding limit", () => {
    assertEquals(isWithinInputLimit("a".repeat(101), 100), false);
  });
});

Deno.test("webhook-utils - isCancelCommand", async (t) => {
  await t.step("returns true for cancel commands", () => {
    assertEquals(isCancelCommand("キャンセル"), true);
    assertEquals(isCancelCommand("cancel"), true);
    assertEquals(isCancelCommand("戻る"), true);
  });

  await t.step("handles whitespace", () => {
    assertEquals(isCancelCommand("  キャンセル  "), true);
  });

  await t.step("returns false for other text", () => {
    assertEquals(isCancelCommand("hello"), false);
    assertEquals(isCancelCommand("取り消し"), false);
  });
});

Deno.test("webhook-utils - parsePolishCommand", async (t) => {
  await t.step("parses Japanese prefix", () => {
    const result = parsePolishCommand("洗練:テストプロンプト");
    assertEquals(result.isCommand, true);
    assertEquals(result.input, "テストプロンプト");
  });

  await t.step("parses English prefix", () => {
    const result = parsePolishCommand("polish:test prompt");
    assertEquals(result.isCommand, true);
    assertEquals(result.input, "test prompt");
  });

  await t.step("returns false for non-command", () => {
    const result = parsePolishCommand("通常のテキスト");
    assertEquals(result.isCommand, false);
    assertEquals(result.input, "");
  });

  await t.step("trims input", () => {
    const result = parsePolishCommand("洗練:  入力テキスト  ");
    assertEquals(result.input, "入力テキスト");
  });
});

Deno.test("webhook-utils - parseRiskCheckCommand", async (t) => {
  await t.step("parses English prefix", () => {
    const result = parseRiskCheckCommand("check:test text");
    assertEquals(result.isCommand, true);
    assertEquals(result.input, "test text");
  });

  await t.step("parses Japanese prefix", () => {
    const result = parseRiskCheckCommand("チェック:テストテキスト");
    assertEquals(result.isCommand, true);
    assertEquals(result.input, "テストテキスト");
  });

  await t.step("returns false for non-command", () => {
    const result = parseRiskCheckCommand("通常のテキスト");
    assertEquals(result.isCommand, false);
    assertEquals(result.input, "");
  });
});
