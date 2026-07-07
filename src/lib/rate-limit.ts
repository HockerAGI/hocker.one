/**
 * Hocker ONE — Rate Limiting
 *
 * ARCH-07: In-memory rate limiter for API routes.
 * Uses a sliding window counter per IP/key.
 * Works in both edge and nodejs runtimes.
 */

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 30;

const store = new Map<string, RateBucket>();

function now(): number {
  return Date.now();
}

function cleanup(): void {
  const t = now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= t) {
      store.delete(key);
    }
  }
}

setInterval(cleanup, 120_000).unref?.();

export function checkRateLimit(
  identifier: string,
  config?: Partial<RateLimitConfig>,
): { allowed: boolean; remaining: number; resetAt: number; retryAfterMs?: number } {
  const windowMs = config?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = config?.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const prefix = config?.keyPrefix ?? "rl";
  const key = `${prefix}:${identifier}`;
  const t = now();

  let bucket = store.get(key);

  if (!bucket || bucket.resetAt <= t) {
    bucket = { count: 1, resetAt: t + windowMs };
    store.set(key, bucket);
    return { allowed: true, remaining: maxRequests - 1, resetAt: bucket.resetAt };
  }

  bucket.count++;

  if (bucket.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterMs: bucket.resetAt - t,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function rateLimitHeaders(result: ReturnType<typeof checkRateLimit>): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfterMs ? { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } : {}),
  };
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export const RATE_LIMIT_PRESETS = {
  public: { windowMs: 60_000, maxRequests: 60 },
  api: { windowMs: 60_000, maxRequests: 30 },
  auth: { windowMs: 15 * 60_000, maxRequests: 10 },
  commands: { windowMs: 60_000, maxRequests: 10 },
  novaChat: { windowMs: 60_000, maxRequests: 20 },
} as const;
