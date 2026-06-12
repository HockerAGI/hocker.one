export const HOCKER_PROVIDER_ORCHESTRATOR_VERSION = "12.7L-2C-A";

type ProviderHealth = "ready" | "configured" | "not_configured" | "upstream_unreachable" | "requires_owner_gate";

function hasEnv(...keys: string[]): boolean {
  return keys.some((key) => String(process.env[key] ?? "").trim().length > 0);
}

function novaBaseUrl(): string {
  return String(process.env.NOVA_AGI_URL ?? process.env.ORCHESTRATOR_BASE_URL ?? "").trim().replace(/\/$/, "");
}

function novaKey(): string {
  return String(process.env.NOVA_ORCHESTRATOR_KEY ?? process.env.NOVA_API_KEY ?? "").trim();
}

export function getHockerProviderOrchestratorPublicContext() {
  return {
    version: HOCKER_PROVIDER_ORCHESTRATOR_VERSION,
    status: "active",
    mode: "provider_orchestrator_inventory_no_duplicate_llm_router",
    user_facing_policy: {
      nova_decides_provider_internally: true,
      user_selects_provider: false,
      provider_names_hidden_from_standard_ui: true,
      public_voice: "NOVA",
    },
    sources: {
      cognitive_router: "nova.agi",
      operational_runtime: "hocker.one",
      owner_gate: "hocker.one",
    },
    rules: {
      do_not_duplicate_nova_agi_llm_router: true,
      hocker_one_does_not_pick_llm_for_user: true,
      nova_agi_selects_model_internally: true,
      hocker_one_controls_execution: true,
      owner_gate_required_for_productive_actions: true,
      queue_lock_required: true,
      evidence_required: true,
    },
    next_step: "12.7L-2C-B delega diagnóstico a hocker-diagnostics-provider-router. NOVA.AGI Always-On Mesh sincronizado en Hocker ONE. Siguiente: 12.7Z-1 SQL normalization + idempotent GitHub worker.",
  };
}

async function fetchNovaProviderStatus(timeoutMs = 8000) {
  const baseUrl = novaBaseUrl();
  const key = novaKey();

  if (!baseUrl || !key) {
    return {
      ok: false,
      status: "not_configured",
      error: "NOVA_AGI_URL o NOVA_ORCHESTRATOR_KEY no configurado.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/providers/status`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        status: "upstream_unreachable",
        http_status: res.status,
        error: data?.error || `NOVA.AGI HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      status: "ready",
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: "upstream_unreachable",
      error: error instanceof Error ? error.message : "Fallo consultando NOVA.AGI providers.",
    };
  } finally {
    clearTimeout(timer);
  }
}

function operationalProviders() {
  return [
    {
      key: "github",
      category: "code",
      configured: hasEnv("HOCKER_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN"),
      health: hasEnv("HOCKER_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN") ? "configured" : "not_configured",
      owner_gate_required: true,
      role: "Repos, branches, commits, PRs y evidencia.",
    },
    {
      key: "supabase",
      category: "data",
      configured: hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
      health: hasEnv("SUPABASE_SERVICE_ROLE_KEY") ? "configured" : "not_configured",
      owner_gate_required: true,
      role: "Datos, memoria, cola, auditoría y estado.",
    },
    {
      key: "vercel",
      category: "cloud",
      configured: hasEnv("VERCEL_TOKEN", "VERCEL_OIDC_TOKEN"),
      health: hasEnv("VERCEL_TOKEN", "VERCEL_OIDC_TOKEN") ? "configured" : "not_configured",
      owner_gate_required: true,
      role: "Deploys, previews, producción y logs.",
    },
    {
      key: "nova_agi",
      category: "cognitive",
      configured: hasEnv("NOVA_AGI_URL", "ORCHESTRATOR_BASE_URL") && hasEnv("NOVA_ORCHESTRATOR_KEY", "NOVA_API_KEY"),
      health: hasEnv("NOVA_AGI_URL", "ORCHESTRATOR_BASE_URL") && hasEnv("NOVA_ORCHESTRATOR_KEY", "NOVA_API_KEY") ? "configured" : "not_configured",
      owner_gate_required: false,
      role: "Router cognitivo nativo de NOVA.",
    },
  ] satisfies Array<{
    key: string;
    category: string;
    configured: boolean;
    health: ProviderHealth;
    owner_gate_required: boolean;
    role: string;
  }>;
}

function diagnosticsProviders() {
  return [
    {
      key: "local_lighthouse",
      configured: hasEnv("CHROME_PATH", "GOOGLE_CHROME_BIN", "CHROMIUM_BIN"),
      owner_gate_required: false,
      role: "Auditoría local si el runtime permite Chrome.",
    },
    {
      key: "pagespeed_insights",
      configured: true,
      owner_gate_required: false,
      role: "Auditoría remota pública; puede fallar por cuota.",
    },
    {
      key: "github_actions_lighthouse",
      configured: hasEnv("HOCKER_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN"),
      owner_gate_required: true,
      role: "Auditoría remota controlada en GitHub Actions.",
    },
    {
      key: "documented_fallback",
      configured: true,
      owner_gate_required: false,
      role: "Último recurso documentado, no simula éxito.",
    },
  ];
}

export async function getHockerUnifiedProviderInventory(projectId = "hocker-one") {
  const nova = await fetchNovaProviderStatus();

  return {
    ok: true,
    version: HOCKER_PROVIDER_ORCHESTRATOR_VERSION,
    project_id: projectId,
    generated_at: new Date().toISOString(),
    user_facing_policy: {
      nova_decides_provider_internally: true,
      user_selects_provider: false,
      provider_names_hidden_from_standard_ui: true,
      standard_ui_label: "NOVA",
    },
    cognitive: {
      source: "nova.agi",
      status: nova.status,
      synced: nova.ok === true,
      router: nova.ok ? nova.data?.provider_router ?? "unknown" : null,
      provider_status: nova.ok ? nova.data?.providers ?? null : null,
      orders: nova.ok ? nova.data?.orders ?? null : null,
      error: nova.ok ? null : nova.error,
    },
    operational: {
      source: "hocker.one",
      providers: operationalProviders(),
    },
    diagnostics: {
      source: "hocker.one",
      providers: diagnosticsProviders(),
      next_step: "Router diagnóstico activo en 12.7L-2C-B. Siguiente: 12.7Z-1 SQL normalization + idempotent GitHub worker.",
    },
    execution_policy: {
      nova_agi_thinks_and_routes_models: true,
      hocker_one_approves_and_executes: true,
      owner_gate_required_for_write_actions: true,
      queue_lock_required: true,
      evidence_required: true,
      no_provider_choice_in_standard_chat_ui: true,
    },
  };
}
