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
  return (cloudflareZeroCreditMode() || process.env.NOVA_CHAT_FREE_ONLY === "true") &&
    process.env.CLOUDFLARE_WORKERS_AI_ENABLED === "true" &&
    process.env.CLOUDFLARE_WORKERS_AI_FREE_PLAN_VERIFIED === "true" &&
    process.env.CLOUDFLARE_ACCOUNT_ID === CF_FREE_ACCOUNT &&
    Boolean(String(process.env.CLOUDFLARE_WORKERS_AI_API_TOKEN ?? "").trim());
}


/**
 * Optional, fail-closed chat-only free route. It is NOT a global AGI routing
 * flag: engineering, research, external tools and material actions must retain
 * their independently governed runtime and existing provider routing.
 */
export function novaChatFreeOnlyRequest(input: {
  project_id: string;
  message: string;
  allow_actions?: boolean;
}): boolean {
  if (process.env.NOVA_CHAT_FREE_ONLY !== "true") return false;
  if (input.project_id !== "hocker-one" || input.allow_actions) return false;
  const message = String(input.message ?? "").trim();
  if (!message) return false;
  return !/\b(investig|investiga|research|latest|benchmark|compara|fuentes|citas|auditor|hoy|reciente|actual|app|aplicaci[oó]n|repo|repositorio|c[oó]digo|codigo|bug|issue|fix|corrige|modifica|actualiza|implementa|integra|despliega|deploy|servidor|herramienta|tool|github|vercel|supabase|api|mcp|workflow|automatiza|apuesta|casino|pron[oó]stico)\b/i.test(message);
}
