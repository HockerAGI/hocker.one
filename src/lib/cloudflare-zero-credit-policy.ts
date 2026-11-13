export const CF_FREE_ACCOUNT = "e53a864ed398f9d933c88b8a2c68c52b";
export const CF_FREE_GATEWAY = "hocker-agi";
export const CF_FREE_MODEL = "@cf/zai-org/glm-4.7-flash";
export const CF_MAX_OUTPUT_TOKENS = 384;
export const CF_MAX_INPUT_CHARS = 8_000;
export const CF_MAX_MESSAGES = 12;

/** Free-only: no paid model routing or implicit credential fallback. */
export function cloudflareZeroCreditMode(): boolean {
  return process.env.AGI_ZERO_CREDIT_ONLY === "true";
}

/** An account name / Standard usage model is NOT proof of Workers Free. */
export function cloudflareFreeRouteConfigured(): boolean {
  return cloudflareZeroCreditMode() &&
    process.env.CLOUDFLARE_WORKERS_AI_ENABLED === "true" &&
    process.env.CLOUDFLARE_WORKERS_AI_FREE_PLAN_VERIFIED === "true" &&
    process.env.CLOUDFLARE_ACCOUNT_ID === CF_FREE_ACCOUNT &&
    Boolean(String(process.env.CLOUDFLARE_WORKERS_AI_API_TOKEN ?? "").trim());
}
