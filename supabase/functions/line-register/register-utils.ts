/**
 * LINE Register ユーティリティ
 */

/**
 * 日本時間（JST, UTC+9）のタイムスタンプを取得
 */
export function getJSTTimestamp(date: Date = new Date()): string {
  const jstOffset = 9 * 60; // JST is UTC+9 (minutes)
  const jstTime = new Date(date.getTime() + jstOffset * 60 * 1000);
  return jstTime.toISOString().replace("Z", "+09:00");
}

/**
 * メールアドレスを正規化（トリム＋小文字化）
 * @returns 正規化されたメール、または null
 */
export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

/**
 * メールアドレスのフォーマットを検証
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  return emailRegex.test(email);
}

/**
 * LINE User ID のフォーマットを検証
 * LINE User ID は 'U' で始まる 33 文字の英数字
 */
export function isValidLineUserId(userId: string): boolean {
  if (!userId || typeof userId !== "string") {
    return false;
  }
  // LINE User ID format: U + 32 hexadecimal characters
  return /^U[a-f0-9]{32}$/i.test(userId);
}

/**
 * opt_in_email パラメータを安全に解析
 * デフォルトは true
 */
export function parseOptInEmail(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() !== "false";
  }
  return true; // default
}

/**
 * CORS レスポンスヘッダー
 */
export const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;

/**
 * エラーレスポンスを作成
 */
export function createErrorResponse(
  message: string,
  status = 400,
  headers: Record<string, string> = CORS_HEADERS,
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers,
  });
}

/**
 * 成功レスポンスを作成
 */
export function createSuccessResponse(
  data: Record<string, unknown>,
  headers: Record<string, string> = CORS_HEADERS,
): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}
