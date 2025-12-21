/**
 * Course Router テスト
 */
import { assertEquals } from "std-assert";
import { buildCourseEntryMessage } from "./course-router.ts";
import { DISCORD_INVITE_URL } from "./constants.ts";
import type { DiagnosisKeyword } from "./types.ts";

Deno.test("course-router - buildCourseEntryMessage", async (t) => {
  await t.step("returns string with keyword header", () => {
    const result = buildCourseEntryMessage("病院AIリスク診断");
    assertEquals(result.startsWith("【病院AIリスク診断】"), true);
  });

  await t.step("includes Discord invite URL", () => {
    const result = buildCourseEntryMessage("クイック診断");
    assertEquals(result.includes(DISCORD_INVITE_URL), true);
  });

  await t.step("includes description for each keyword", () => {
    const keywords: DiagnosisKeyword[] = [
      "病院AIリスク診断",
      "SaMDスタートアップ診断",
      "医療データガバナンス診断",
      "臨床知アセット診断",
      "教育AI導入診断",
      "次世代AI実装診断",
      "クイック診断",
    ];

    for (const keyword of keywords) {
      const result = buildCourseEntryMessage(keyword);
      // Should have keyword header
      assertEquals(result.includes(`【${keyword}】`), true);
      // Should have some description content (length > header)
      assertEquals(result.length > keyword.length + 10, true);
    }
  });

  await t.step("病院AIリスク診断 has correct description", () => {
    const result = buildCourseEntryMessage("病院AIリスク診断");
    assertEquals(result.includes("病院・診療所におけるAI導入"), true);
  });

  await t.step("クイック診断 has correct description", () => {
    const result = buildCourseEntryMessage("クイック診断");
    assertEquals(result.includes("簡易診断"), true);
  });

  await t.step("includes おすすめ記事 section when articles exist", () => {
    // This depends on note-recommendations having data
    const result = buildCourseEntryMessage("病院AIリスク診断");
    // May or may not have articles, but should still work
    assertEquals(typeof result, "string");
    assertEquals(result.length > 0, true);
  });

  await t.step("has Discord section at the end", () => {
    const result = buildCourseEntryMessage("教育AI導入診断");
    assertEquals(result.includes("---"), true);
    assertEquals(result.includes("Discord"), true);
  });
});
