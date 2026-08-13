/**
 * Hocker ONE — CORS Helper
 *
 * API-01: Centralized CORS header management for API routes.
 * Provides both middleware-level and route-level CORS support.
 */

export type CorsConfig = {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  maxAge?: number;
  allowCredentials?: boolean;
};

const DEFAULT_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const DEFAULT_HEADERS = ["Content-Type", "Authorization", "apikey"];
const DEFAULT_MAX_AGE = 86400;

function getOrigins(): string[] {
  const raw = String(process.env.ALLOWED_ORIGINS ?? "").trim();
  if (!raw) return ["https://hockerone.vercel.app"];
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

export function getCorsHeaders(config?: CorsConfig): Record<string, string> {
  const origins = config?.allowedOrigins ?? getOrigins();
  const methods = config?.allowedMethods ?? DEFAULT_METHODS;
  const headers = config?.allowedHeaders ?? DEFAULT_HEADERS;
  const maxAge = config?.maxAge ?? DEFAULT_MAX_AGE;
  const credentials = config?.allowCredentials ?? true;

  return {
    "Access-Control-Allow-Origin": origins.length === 1 ? (origins[0] ?? "") : origins.join(", "),
    "Access-Control-Allow-Methods": methods.join(", "),
    "Access-Control-Allow-Headers": headers.join(", "),
    "Access-Control-Max-Age": String(maxAge),
    "Access-Control-Allow-Credentials": String(credentials),
  };
}

export function isPreflight(request: Request): boolean {
  return request.method === "OPTIONS";
}

export function createCorsResponse(config?: CorsConfig): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(config),
  });
}

export function withCors(response: Response, config?: CorsConfig): Response {
  const headers = getCorsHeaders(config);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
