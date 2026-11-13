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
  tools_requested?: boolean;
}): boolean {
  if (process.env.NOVA_CHAT_FREE_ONLY !== "true") return false;
  if (input.project_id !== "hocker-one" || input.allow_actions || input.tools_requested) return false;
  const message = String(input.message ?? "").trim();
  if (!message || message.length > 500) return false;

  // Opt IN only for self-contained conversational phrasing. Unknown intents
  // remain on their existing governed provider/tool-capable route.
  const conversational = /^(hola\b|buen[oa]s?\b|saludos\b|responde\b|explica\b|define\b|cu[eé]ntame\b|cuentame\b|qu[eé] es\b|que es\b|c[oó]mo est[aá]s\b|dime\b|escribe\b|redacta\b|resume\b|gracias\b)/i.test(message);
  if (!conversational) return false;

  // Deny tool, freshness, financial, engineering or account-state intent,
  // even when phrased as "responde..." or "dime...".
  const toolIntent = /\b(base44|apps?|aplicaci[oó]n|lista|listar|listado|list\b|lists\b|consulta|consultar|buscar|busca|fetch|obt[eé]n|obtener|muestra|mostrar|verifica|verificar|check|archivo|file|repositor|repo|repositorio|pull|issue|github|git|vercel|supabase|openai|mcp|tool|herramienta|api|servidor|server|deploy|despliegue|dominio|dns|cron|logs?|registro|workflow|automatiza|automatizar|c[oó]digo|codigo|programa|programar|bug|error|benchmark|corrige|modifica|actualiza|implementa|integra|investig|fuentes|citas|research|compara|hoy|reciente|actual|realtime|estado|status|memoria|correo|email|calendario|crm|pagos?|casino|apuesta|pron[oó]stico)\b/i.test(message);
  return !toolIntent;
}
