/**
 * Hocker ONE — Error Sanitization
 *
 * PR-05: Remove internal implementation details from public-facing
 * API error responses. Prevents leaking stack traces, SQL messages,
 * internal keys, and other sensitive information.
 */

const SENSITIVE_PATTERNS = [
  /supabase/i,
  /jwt/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /service[_-]?role/i,
  /password/i,
  /credential/i,
  /stack/i,
  /at\s+\w+\s+\(/i,
  /node_modules/i,
  /\/src\//i,
  /\/home\//i,
  /\/vercel\//i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /database/i,
  /relation\s+"?\w+"?\s+does not exist/i,
  /permission denied/i,
  /violate.*constraint/i,
  /duplicate key/i,
  /invalid input syntax/i,
];

export function sanitizePublicError(error: unknown): string {
  if (!error) return "Error interno. Intenta de nuevo.";

  let raw: string;

  if (error instanceof Error) {
    raw = error.message;
  } else if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") {
      raw = obj.message;
    } else if (typeof obj.error === "string") {
      raw = obj.error;
    } else {
      raw = String(error);
    }
  } else if (typeof error === "string") {
    raw = error;
  } else {
    raw = String(error);
  }

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(raw)) {
      return "Error interno del sistema. El equipo ha sido notificado.";
    }
  }

  if (raw.length > 300) {
    return raw.slice(0, 300) + "…";
  }

  return raw;
}

export function createSanitizedErrorResponse(
  error: unknown,
  _status = 500,
  traceId?: string,
): { ok: false; error: string; trace_id?: string } {
  return {
    ok: false,
    error: sanitizePublicError(error),
    ...(traceId ? { trace_id: traceId } : {}),
  };
}
