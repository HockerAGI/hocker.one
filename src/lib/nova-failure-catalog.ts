export const NOVA_FAILURE_CLASSIFIER_VERSION = "2026.11.13-1";

export type FailureCategory =
  | "inference_routes_unavailable"
  | "ai_gateway_credentials_missing"
  | "ai_gateway_auth_rejected"
  | "model_rate_limited";

type FailureDefinition = {
  label: string;
  meaning: string;
  action: string;
  risk: "medium" | "high";
};

/** Fixed phrases only. Never copy database error messages into long-lived memory. */
export const FAILURE_DEFINITIONS: Record<FailureCategory, FailureDefinition> = {
  inference_routes_unavailable: {
    label: "Rutas de inferencia temporalmente indisponibles",
    meaning: "Se observaron fallos de enrutamiento. Su causa raíz no está verificada.",
    action: "Revisar estado de las rutas permitidas, autenticación, métricas y alternativas locales sin cambiar cuotas ni permisos.",
    risk: "medium",
  },
  ai_gateway_credentials_missing: {
    label: "Credenciales de gateway no configuradas",
    meaning: "El worker registró ausencia de credenciales de inferencia, sin revelar valores.",
    action: "Verificar los scopes y la configuración con el operador autorizado. No copiar claves a memoria ni a tickets.",
    risk: "high",
  },
  ai_gateway_auth_rejected: {
    label: "Autenticación de proveedor rechazada",
    meaning: "El worker recibió un rechazo de autenticación; no se infiere el motivo exacto.",
    action: "Revisar configuración y autorización del proveedor con datos redactados; conservar Owner Gate y presupuestos.",
    risk: "high",
  },
  model_rate_limited: {
    label: "Límite gratuito de inferencia alcanzado",
    meaning: "El proveedor devolvió un aviso de rate limit en una ejecución fallida.",
    action: "Priorizar ejecución sin inferencia cuando sea suficiente y un modelo local verificado; no contratar créditos automáticamente.",
    risk: "medium",
  },
};

export function classifyKnownWorkerFailure(raw: unknown): FailureCategory | null {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  const error = raw.trim();
  if (/^AGI_ALL_ROUTES_TEMPORARY_FAILED(?::|$)/i.test(error)) return "inference_routes_unavailable";
  if (/^AI_GATEWAY_AUTH_NOT_CONFIGURED(?::|$)/i.test(error)) return "ai_gateway_credentials_missing";
  if (/^Authentication failed\. Check that your Vercel credential/i.test(error)) return "ai_gateway_auth_rejected";
  if (/^Free tier requests on this model are rate-limited\./i.test(error)) return "model_rate_limited";
  return null;
}

/** Eliminate previously published/pending candidates before applying bounded work caps. */
export function selectNewLearningGroups<T extends { source_hash: string }>(
  groups: readonly T[], existingHashes: ReadonlySet<string>, limit: number,
): T[] {
  return groups.filter((group) => !existingHashes.has(group.source_hash))
    .slice(0, Math.max(0, limit));
}
