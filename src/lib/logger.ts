/**
 * Hocker ONE — Structured Logger
 *
 * Provides JSON-structured logging with trace IDs, severity levels,
 * and context injection. Replaces console.log/console.error across
 * the codebase for observability in production (Vercel, Langfuse).
 *
 * PR-04: Implement structured logging per audit recommendation.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

function currentMinLevel(): LogLevel {
  const env = String(process.env.LOG_LEVEL ?? "info").trim().toLowerCase();
  if (env in LOG_LEVEL_PRIORITY) return env as LogLevel;
  return "info";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentMinLevel()];
}

export type LogContext = {
  trace_id?: string;
  project_id?: string;
  route?: string;
  [key: string]: unknown;
};

function formatLog(level: LogLevel, message: string, ctx?: LogContext): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "hocker-one",
    message,
    ...(ctx ? { context: ctx } : {}),
  };
  return JSON.stringify(entry);
}

function formatPublic(level: LogLevel, message: string, ctx?: LogContext): string {
  return `[${level.toUpperCase()}] ${message}${ctx?.trace_id ? ` trace=${ctx.trace_id}` : ""}`;
}

function isStructured(): boolean {
  return process.env.LOG_FORMAT !== "text";
}

export const log = {
  debug(message: string, ctx?: LogContext) {
    if (!shouldLog("debug")) return;
    const out = isStructured() ? formatLog("debug", message, ctx) : formatPublic("debug", message, ctx);
    console.debug(out);
  },

  info(message: string, ctx?: LogContext) {
    if (!shouldLog("info")) return;
    const out = isStructured() ? formatLog("info", message, ctx) : formatPublic("info", message, ctx);
    console.info(out);
  },

  warn(message: string, ctx?: LogContext) {
    if (!shouldLog("warn")) return;
    const out = isStructured() ? formatLog("warn", message, ctx) : formatPublic("warn", message, ctx);
    console.warn(out);
  },

  error(message: string, ctx?: LogContext) {
    if (!shouldLog("error")) return;
    const out = isStructured() ? formatLog("error", message, ctx) : formatPublic("error", message, ctx);
    console.error(out);
  },

  fatal(message: string, ctx?: LogContext) {
    const out = isStructured() ? formatLog("fatal", message, ctx) : formatPublic("fatal", message, ctx);
    console.error(out);
  },
};
