/**
 * 構造化ロガーモジュール
 * JSON形式でログを出力し、ログ分析を容易にする
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  /** 関数名 */
  function?: string;
  /** ユーザーID（プライバシー保護のため末尾4文字のみ） */
  userId?: string;
  /** リクエストID */
  requestId?: string;
  /** 処理時間（ミリ秒） */
  durationMs?: number;
  /** その他のコンテキスト */
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * ログを構造化JSON形式で出力
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  const json = JSON.stringify(entry);

  switch (level) {
    case "debug":
      console.debug(json);
      break;
    case "info":
      console.log(json);
      break;
    case "warn":
      console.warn(json);
      break;
    case "error":
      console.error(json);
      break;
  }
}

/**
 * 関数名をバインドしたロガーを作成
 */
export function createLogger(functionName: string) {
  return {
    debug: (message: string, context?: Omit<LogContext, "function">) =>
      log("debug", message, { function: functionName, ...context }),
    info: (message: string, context?: Omit<LogContext, "function">) =>
      log("info", message, { function: functionName, ...context }),
    warn: (message: string, context?: Omit<LogContext, "function">) =>
      log("warn", message, { function: functionName, ...context }),
    error: (message: string, context?: Omit<LogContext, "function">) =>
      log("error", message, { function: functionName, ...context }),
  };
}

/**
 * ユーザーIDを匿名化（末尾4文字のみ表示）
 */
export function anonymizeUserId(userId: string): string {
  if (userId.length <= 4) return "****";
  return "..." + userId.slice(-4);
}

/**
 * エラーを構造化形式に変換
 */
export function errorToContext(err: unknown): LogContext {
  if (err instanceof Error) {
    return {
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack?.split("\n").slice(0, 3).join(" | "),
    };
  }
  return { error: String(err) };
}
