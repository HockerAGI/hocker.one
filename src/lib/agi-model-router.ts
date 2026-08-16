import { anthropicDirectProvider } from "@/lib/agi-model-providers/anthropic";
import { geminiDirectProvider } from "@/lib/agi-model-providers/gemini";
import { ollamaProvider } from "@/lib/agi-model-providers/ollama";
import { openaiDirectProvider } from "@/lib/agi-model-providers/openai";
import { vercelGatewayProvider } from "@/lib/agi-model-providers/vercel-gateway";
import {
  AgiProviderError,
  envValue,
  type AgiCompletionInput,
  type AgiCompletionResult,
  type AgiModelProvider,
  type AgiModelRoute,
  type AgiProviderAttempt,
} from "@/lib/agi-model-providers/types";

const PROVIDERS: Record<AgiModelRoute, AgiModelProvider> = {
  "vercel-gateway": vercelGatewayProvider,
  "openai-direct": openaiDirectProvider,
  "gemini-direct": geminiDirectProvider,
  "anthropic-direct": anthropicDirectProvider,
  ollama: ollamaProvider,
};

const DEFAULT_ORDER: AgiModelRoute[] = [
  "vercel-gateway",
  "openai-direct",
  "gemini-direct",
  "anthropic-direct",
  "ollama",
];

// Fallback classes intentionally include auth, quota/balance/rate-limit, timeout and 5xx failures.
const FALLBACK_ERROR_HINTS = /401|403|429|quota|balance|rate|timeout|5\d\d/i;

function routeOrder(): AgiModelRoute[] {
  const configured = envValue("AGI_MODEL_ROUTE_ORDER")
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is AgiModelRoute => value in PROVIDERS);
  const result: AgiModelRoute[] = [];
  for (const route of [...configured, ...DEFAULT_ORDER]) {
    if (!result.includes(route)) result.push(route);
  }
  return result;
}

function errorCode(error: unknown): string {
  if (error instanceof AgiProviderError) return error.code;
  if (error instanceof Error) return error.message.slice(0, 160).replace(/\s+/g, "_").toUpperCase();
  return "AGI_PROVIDER_UNKNOWN_ERROR";
}

function fallbackEligible(error: unknown): boolean {
  if (error instanceof AgiProviderError) return error.fallback_eligible;
  return FALLBACK_ERROR_HINTS.test(error instanceof Error ? error.message : String(error));
}

export function configuredAgiRoutes(oidcToken?: string | null): AgiModelRoute[] {
  return routeOrder().filter((route) => PROVIDERS[route].configured({ oidc_token: oidcToken }));
}

export function agiModelRouterConfigured(oidcToken?: string | null): boolean {
  return configuredAgiRoutes(oidcToken).length > 0;
}

export async function completeAgi(input: AgiCompletionInput): Promise<AgiCompletionResult> {
  const attempts: AgiProviderAttempt[] = [];
  const order = routeOrder();
  let sawConfigured = false;

  for (const route of order) {
    const provider = PROVIDERS[route];
    const configured = provider.configured({ oidc_token: input.oidc_token });
    if (!configured) {
      attempts.push({ route, configured: false, ok: false, error_code: "NOT_CONFIGURED" });
      continue;
    }
    sawConfigured = true;
    const started = Date.now();
    try {
      const result = await provider.complete(input);
      attempts.push({ route, configured: true, ok: true, latency_ms: Date.now() - started });
      return { ...result, attempts };
    } catch (error) {
      attempts.push({
        route,
        configured: true,
        ok: false,
        error_code: errorCode(error),
        latency_ms: Date.now() - started,
      });
      if (!fallbackEligible(error)) throw error;
    }
  }

  const error = new AgiProviderError(
    sawConfigured ? "Todas las rutas de inferencia configuradas fallaron" : "No existe una ruta de inferencia configurada",
    { code: sawConfigured ? "AGI_ALL_ROUTES_FAILED" : "AGI_INFERENCE_NOT_CONFIGURED", fallback_eligible: false },
  );
  Object.assign(error, { attempts });
  throw error;
}
