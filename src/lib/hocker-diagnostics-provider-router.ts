export const HOCKER_DIAGNOSTICS_PROVIDER_ROUTER_VERSION = "12.7L-2C-B";

export type HockerDiagnosticsProviderKey =
  | "local_lighthouse"
  | "pagespeed_insights"
  | "github_actions_lighthouse"
  | "documented_fallback";

type HockerDiagnosticsProviderStatus =
  | "ready"
  | "available"
  | "not_configured"
  | "requires_owner_gate"
  | "fallback";

type DiagnosticsProvider = {
  key: HockerDiagnosticsProviderKey;
  label: string;
  status: HockerDiagnosticsProviderStatus;
  configured: boolean;
  owner_gate_required: boolean;
  executes_in_hocker_one: boolean;
  role: string;
  limitations: string[];
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function hasEnv(...keys: string[]): boolean {
  return keys.some((key) => clean(process.env[key]).length > 0);
}

function hasLocalChromeSignal(): boolean {
  return hasEnv("CHROME_PATH", "GOOGLE_CHROME_BIN", "CHROMIUM_BIN", "PUPPETEER_EXECUTABLE_PATH");
}

function hasGitHubToken(): boolean {
  return hasEnv("HOCKER_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN");
}

export function getHockerDiagnosticsProviderRouterPublicContext() {
  return {
    version: HOCKER_DIAGNOSTICS_PROVIDER_ROUTER_VERSION,
    status: "active",
    mode: "diagnostics_provider_router_only",
    source: "hocker.one",
    purpose:
      "Elegir proveedor de diagnóstico para Lighthouse/PWA/PageSpeed sin tocar ni duplicar el router LLM nativo de NOVA.AGI.",
    provider_order: [
      "local_lighthouse",
      "pagespeed_insights",
      "github_actions_lighthouse",
      "documented_fallback",
    ] as HockerDiagnosticsProviderKey[],
    non_goals: [
      "No seleccionar modelos LLM.",
      "No exponer selector de proveedor al usuario.",
      "No reemplazar NOVA.AGI provider router.",
      "No declarar Lighthouse OK si sólo existe fallback documentado.",
    ],
    rules: {
      nova_agi_keeps_llm_routing: true,
      hocker_one_routes_diagnostics_only: true,
      owner_gate_required_for_github_actions_dispatch: true,
      evidence_required: true,
      fallback_must_document_cause: true,
      no_fake_success: true,
    },
    public_trace: "12.7L-2C-B-diagnostics-provider-router",
    next_step: "12.7Z-1 — SQL normalization + idempotent GitHub worker.",
  };
}

export function getHockerDiagnosticsProviderInventory() {
  const providers: DiagnosticsProvider[] = [
    {
      key: "local_lighthouse",
      label: "Local Lighthouse",
      status: hasLocalChromeSignal() ? "ready" : "not_configured",
      configured: hasLocalChromeSignal(),
      owner_gate_required: false,
      executes_in_hocker_one: false,
      role: "Ejecuta Lighthouse local desde Ubuntu/Termux o runner con Chrome disponible.",
      limitations: [
        "No depende de NOVA.AGI.",
        "Puede fallar en Android/Proot si Chrome no arranca.",
        "No debe usarse para rutas privadas sin cookie owner controlada.",
      ],
    },
    {
      key: "pagespeed_insights",
      label: "PageSpeed Insights",
      status: "available",
      configured: true,
      owner_gate_required: false,
      executes_in_hocker_one: false,
      role: "Auditoría remota pública para rutas indexables.",
      limitations: [
        "Sólo audita URLs públicas.",
        "Puede fallar por cuota 429.",
        "No valida sesión privada.",
      ],
    },
    {
      key: "github_actions_lighthouse",
      label: "GitHub Actions Lighthouse",
      status: hasGitHubToken() ? "requires_owner_gate" : "not_configured",
      configured: hasGitHubToken(),
      owner_gate_required: true,
      executes_in_hocker_one: false,
      role: "Ejecuta diagnóstico en runner Ubuntu con Chrome estable después de aprobación owner.",
      limitations: [
        "Requiere workflow presente en main.",
        "Requiere token con permiso para dispatch si se dispara por API.",
        "No debe ejecutar escrituras productivas.",
      ],
    },
    {
      key: "documented_fallback",
      label: "Documented fallback",
      status: "fallback",
      configured: true,
      owner_gate_required: false,
      executes_in_hocker_one: false,
      role: "Documenta causa, proveedor fallido, evidencia faltante y siguiente intento.",
      limitations: [
        "No equivale a Lighthouse OK.",
        "No desbloquea Fase 13 por sí solo.",
        "Sirve para continuidad honesta.",
      ],
    },
  ];

  return {
    ok: true,
    version: HOCKER_DIAGNOSTICS_PROVIDER_ROUTER_VERSION,
    generated_at: new Date().toISOString(),
    source: "hocker.one",
    providers,
    selected: selectHockerDiagnosticsProvider(providers),
  };
}

export function selectHockerDiagnosticsProvider(providers = getHockerDiagnosticsProviderInventory().providers) {
  const local = providers.find((provider) => provider.key === "local_lighthouse" && provider.configured);
  if (local) {
    return {
      provider_key: local.key,
      status: "selected",
      reason: "Chrome local detectado. Intentar Lighthouse local primero.",
    };
  }

  const psi = providers.find((provider) => provider.key === "pagespeed_insights");
  if (psi) {
    return {
      provider_key: psi.key,
      status: "selected",
      reason: "Lighthouse local no disponible. Usar PageSpeed Insights para rutas públicas.",
    };
  }

  const gha = providers.find((provider) => provider.key === "github_actions_lighthouse" && provider.configured);
  if (gha) {
    return {
      provider_key: gha.key,
      status: "selected",
      reason: "Usar GitHub Actions con Owner Gate.",
    };
  }

  return {
    provider_key: "documented_fallback" as const,
    status: "selected",
    reason: "Ningún proveedor ejecutable disponible. Documentar causa sin simular éxito.",
  };
}
