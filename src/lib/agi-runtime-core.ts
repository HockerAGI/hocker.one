import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AGI_REGISTRY } from "@/lib/hocker-dashboard";

export type RuntimeToolStatusKind =
  | "connected"
  | "partial"
  | "missing_key"
  | "missing_code"
  | "blocked";

type JsonObject = Record<string, unknown>;

type RuntimeToolCategory =
  | "core"
  | "code"
  | "data"
  | "cloud"
  | "ads"
  | "payments"
  | "domain"
  | "security"
  | "media"
  | "jobs"
  | "observability"
  | "notifications";

type RuntimeToolImplementation =
  | "executor_ready"
  | "runtime_ready"
  | "catalog_only"
  | "missing_code"
  | "blocked";

type EnvGroup = {
  label: string;
  any_of: string[];
  required?: boolean;
};

export type RuntimeTool = {
  tool_key: string;
  name: string;
  provider: string;
  category: RuntimeToolCategory;
  required_env: string[];
  optional_env?: string[];
  env_groups?: EnvGroup[];
  supports_read: boolean;
  supports_write: boolean;
  supports_realtime: boolean;
  implementation_status: RuntimeToolImplementation;
  owner_gate_required: boolean;
  dry_run_first: boolean;
  safe_note: string;
  next_step: string;
};

export type RuntimeToolStatus = RuntimeTool & {
  status: RuntimeToolStatusKind;
  status_label: "Conectado" | "Parcial" | "Falta llave" | "Falta código" | "Bloqueado";
  status_hint: string;
  configured_env_count: number;
  env_present: string[];
  missing_env: string[];
  missing_groups: string[];
  alias_hits: Record<string, string[]>;
  execution_enabled: boolean;
};

const TOOL_CATALOG: RuntimeTool[] = [
  {
    tool_key: "nova_orchestrator",
    name: "NOVA Orquestador",
    provider: "NOVA",
    category: "core",
    required_env: ["NOVA_AGI_URL", "NOVA_ORCHESTRATOR_KEY"],
    optional_env: ["HOCKER_ONE_INTERNAL_TOKEN"],
    supports_read: true,
    supports_write: true,
    supports_realtime: true,
    implementation_status: "runtime_ready",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Chat, criterio, ruteo y decisiones bajo control.",
    next_step: "Probar streaming POST desde /chat y registrar acciones en runtime.",
  },
  {
    tool_key: "supabase",
    name: "Supabase",
    provider: "Supabase",
    category: "data",
    required_env: ["SUPABASE_SERVICE_ROLE_KEY"],
    optional_env: ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    env_groups: [
      { label: "supabase_url", any_of: ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"], required: true },
      { label: "supabase_admin", any_of: ["SUPABASE_SERVICE_ROLE_KEY"], required: true },
    ],
    supports_read: true,
    supports_write: true,
    supports_realtime: true,
    implementation_status: "executor_ready",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Datos, memoria, runtime, tareas, auditoría y estado.",
    next_step: "Crear executor controlado para consultas seguras y operaciones dry-run.",
  },
  {
    tool_key: "github",
    name: "GitHub",
    provider: "GitHub",
    category: "code",
    required_env: ["HOCKER_GITHUB_TOKEN"],
    optional_env: ["GITHUB_TOKEN", "GH_TOKEN", "GITHUB_APP_ID", "GITHUB_INSTALLATION_ID"],
    env_groups: [
      { label: "github_token", any_of: ["HOCKER_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN"], required: true },
    ],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Repos, commits, ramas, archivos y PRs. Token detectado como HOCKER_GITHUB_TOKEN si existe.",
    next_step: "12.7B-1: crear GitHub executor real con get_repo, list_tree, read_file, create_branch, upsert_file y create_pr.",
  },
  {
    tool_key: "vercel",
    name: "Vercel",
    provider: "Vercel",
    category: "cloud",
    required_env: ["VERCEL_TOKEN"],
    optional_env: ["VERCEL_PROJECT_ID", "VERCEL_ORG_ID", "VERCEL_TEAM_ID", "VERCEL_OIDC_TOKEN", "VERCEL_PROJECT_PRODUCTION_URL"],
    env_groups: [
      { label: "vercel_api_token", any_of: ["VERCEL_TOKEN"], required: true },
      { label: "vercel_project", any_of: ["VERCEL_PROJECT_ID", "VERCEL_ORG_ID", "VERCEL_TEAM_ID"], required: false },
      { label: "vercel_oidc", any_of: ["VERCEL_OIDC_TOKEN"], required: false },
    ],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Deploys, dominios, logs y estado. OIDC ayuda en entorno Vercel, pero no reemplaza VERCEL_TOKEN para control API completo.",
    next_step: "12.7B-3: inspector de deploys y estado de producción.",
  },
  {
    tool_key: "openai",
    name: "OpenAI",
    provider: "OpenAI",
    category: "core",
    required_env: ["OPENAI_API_KEY"],
    supports_read: true,
    supports_write: false,
    supports_realtime: true,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Modelo, razonamiento, visión, archivos y herramientas según backend.",
    next_step: "Agregar OPENAI_API_KEY si NOVA usará modelos OpenAI directamente.",
  },
  {
    tool_key: "gemini",
    name: "Gemini / Google AI",
    provider: "Google",
    category: "core",
    required_env: ["GEMINI_API_KEY"],
    optional_env: ["GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
    env_groups: [
      { label: "gemini_api_key", any_of: ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"], required: true },
    ],
    supports_read: true,
    supports_write: false,
    supports_realtime: true,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Modelo alterno, análisis multimodal y razonamiento.",
    next_step: "Agregar llave y definir cuándo NOVA enruta a Gemini.",
  },
  {
    tool_key: "meta_ads",
    name: "Meta Ads",
    provider: "Meta",
    category: "ads",
    required_env: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
    optional_env: ["FACEBOOK_ACCESS_TOKEN", "META_APP_ID", "META_APP_SECRET"],
    env_groups: [
      { label: "meta_token", any_of: ["META_ACCESS_TOKEN", "FACEBOOK_ACCESS_TOKEN"], required: true },
      { label: "meta_ad_account", any_of: ["META_AD_ACCOUNT_ID"], required: true },
    ],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Campañas, audiencias, anuncios y reportes. No ejecutar campañas sin owner approval.",
    next_step: "Configurar token y crear executor de reportes primero, acciones después.",
  },
  {
    tool_key: "google_ads",
    name: "Google Ads",
    provider: "Google",
    category: "ads",
    required_env: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"],
    optional_env: ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET"],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Campañas, búsqueda, performance y reportes.",
    next_step: "Configurar OAuth y empezar solo con lectura de performance.",
  },
  {
    tool_key: "tiktok_ads",
    name: "TikTok Ads",
    provider: "TikTok",
    category: "ads",
    required_env: ["TIKTOK_ACCESS_TOKEN", "TIKTOK_ADVERTISER_ID"],
    optional_env: ["TIKTOK_APP_ID", "TIKTOK_SECRET"],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Campañas TikTok y reportes.",
    next_step: "Configurar llaves antes de crear executor.",
  },
  {
    tool_key: "linkedin_ads",
    name: "LinkedIn Ads",
    provider: "LinkedIn",
    category: "ads",
    required_env: ["LINKEDIN_ACCESS_TOKEN"],
    optional_env: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Campañas B2B y reportes.",
    next_step: "Configurar OAuth antes de crear executor.",
  },
  {
    tool_key: "stripe",
    name: "Stripe",
    provider: "Stripe",
    category: "payments",
    required_env: ["STRIPE_SECRET_KEY"],
    optional_env: ["STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Pagos, clientes, facturación y eventos. Toda acción financiera requiere aprobación.",
    next_step: "Configurar llave y crear executor de lectura antes de cobros.",
  },
  {
    tool_key: "paypal",
    name: "PayPal",
    provider: "PayPal",
    category: "payments",
    required_env: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"],
    optional_env: ["PAYPAL_WEBHOOK_ID"],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Pagos, órdenes, capturas y estado.",
    next_step: "Configurar llaves y sandbox antes de producción.",
  },
  {
    tool_key: "d24",
    name: "D24",
    provider: "D24",
    category: "payments",
    required_env: ["D24_API_KEY", "D24_SECRET_KEY", "D24_MERCHANT_ID"],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "missing_code",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Pasarela para Chido Casino. Aún no hay implementación ni llaves detectadas.",
    next_step: "Crear integración desde documentación oficial de D24 cuando se apruebe onboarding.",
  },
  {
    tool_key: "namecheap",
    name: "Namecheap",
    provider: "Namecheap",
    category: "domain",
    required_env: ["NAMECHEAP_API_USER", "NAMECHEAP_API_KEY"],
    optional_env: ["NAMECHEAP_USERNAME", "NAMECHEAP_CLIENT_IP"],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Dominios y disponibilidad.",
    next_step: "Configurar llaves y permitir primero consultas de disponibilidad.",
  },
  {
    tool_key: "cloudflare",
    name: "Cloudflare",
    provider: "Cloudflare",
    category: "security",
    required_env: ["CLOUDFLARE_API_TOKEN"],
    optional_env: ["CLOUDFLARE_ZONE_ID", "CF_API_TOKEN"],
    env_groups: [
      { label: "cloudflare_token", any_of: ["CLOUDFLARE_API_TOKEN", "CF_API_TOKEN"], required: true },
    ],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "DNS, seguridad, cache y reglas.",
    next_step: "Configurar token limitado por zona y crear inspector DNS.",
  },
  {
    tool_key: "hetzner",
    name: "Hetzner",
    provider: "Hetzner",
    category: "cloud",
    required_env: ["HETZNER_TOKEN"],
    optional_env: ["HCLOUD_TOKEN", "HETZNER_API_TOKEN"],
    env_groups: [
      { label: "hetzner_token", any_of: ["HETZNER_TOKEN", "HCLOUD_TOKEN", "HETZNER_API_TOKEN"], required: true },
    ],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Servidores, red, backups y health.",
    next_step: "Configurar token y crear health inspector antes de acciones.",
  },
  {
    tool_key: "heygen",
    name: "HeyGen",
    provider: "HeyGen",
    category: "media",
    required_env: ["HEYGEN_API_KEY"],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Videos, avatares y assets para PRO IA.",
    next_step: "Configurar llave y crear executor de jobs con revisión.",
  },
  {
    tool_key: "trigger",
    name: "Trigger.dev",
    provider: "Trigger.dev",
    category: "jobs",
    required_env: ["TRIGGER_SECRET_KEY"],
    optional_env: ["TRIGGER_API_KEY"],
    env_groups: [
      { label: "trigger_key", any_of: ["TRIGGER_SECRET_KEY", "TRIGGER_API_KEY"], required: true },
    ],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "runtime_ready",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Jobs, tareas y ejecución controlada.",
    next_step: "Usar solo para colas controladas y trazadas.",
  },
  {
    tool_key: "langfuse",
    name: "Langfuse",
    provider: "Langfuse",
    category: "observability",
    required_env: ["LANGFUSE_SECRET_KEY"],
    optional_env: ["LANGFUSE_PUBLIC_KEY", "LANGFUSE_HOST", "LANGFUSE_BASE_URL"],
    env_groups: [
      { label: "langfuse_key", any_of: ["LANGFUSE_SECRET_KEY"], required: true },
      { label: "langfuse_host", any_of: ["LANGFUSE_HOST", "LANGFUSE_BASE_URL"], required: false },
    ],
    supports_read: true,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "runtime_ready",
    owner_gate_required: false,
    dry_run_first: false,
    safe_note: "Trazas, auditoría y observabilidad.",
    next_step: "Conectar runs AGI y acciones a trazas por tool.",
  },
  {
    tool_key: "email",
    name: "Email / Resend / SMTP",
    provider: "Email",
    category: "notifications",
    required_env: ["RESEND_API_KEY"],
    optional_env: ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"],
    env_groups: [
      { label: "email_provider", any_of: ["RESEND_API_KEY", "SMTP_HOST"], required: true },
    ],
    supports_read: false,
    supports_write: true,
    supports_realtime: false,
    implementation_status: "catalog_only",
    owner_gate_required: true,
    dry_run_first: true,
    safe_note: "Alertas owner y correos transaccionales.",
    next_step: "Elegir proveedor y crear plantillas de alerta.",
  },
];

function envValue(key: string): string {
  return String(process.env[key] ?? "").trim();
}

function hasEnv(key: string): boolean {
  return envValue(key).length > 0;
}

function allEnvKeys(tool: RuntimeTool): string[] {
  return Array.from(new Set([...(tool.required_env ?? []), ...(tool.optional_env ?? []), ...(tool.env_groups ?? []).flatMap((group) => group.any_of)]));
}

function buildGroups(tool: RuntimeTool): EnvGroup[] {
  if (tool.env_groups?.length) return tool.env_groups;
  return (tool.required_env ?? []).map((key) => ({ label: key, any_of: [key], required: true }));
}

function labelForStatus(status: RuntimeToolStatusKind): RuntimeToolStatus["status_label"] {
  switch (status) {
    case "connected":
      return "Conectado";
    case "partial":
      return "Parcial";
    case "missing_key":
      return "Falta llave";
    case "missing_code":
      return "Falta código";
    case "blocked":
      return "Bloqueado";
  }
}

function statusFor(tool: RuntimeTool): RuntimeToolStatus {
  const groups = buildGroups(tool);
  const requiredGroups = groups.filter((group) => group.required !== false);
  const aliasHits: Record<string, string[]> = {};

  for (const group of groups) {
    aliasHits[group.label] = group.any_of.filter(hasEnv);
  }

  const missingGroups = requiredGroups
    .filter((group) => group.any_of.every((key) => !hasEnv(key)))
    .map((group) => group.label);

  const envPresent = allEnvKeys(tool).filter(hasEnv);
  const missingEnv = requiredGroups
    .filter((group) => group.any_of.every((key) => !hasEnv(key)))
    .flatMap((group) => group.any_of);

  let status: RuntimeToolStatusKind;

  if (tool.implementation_status === "blocked") {
    status = "blocked";
  } else if (tool.implementation_status === "missing_code") {
    status = "missing_code";
  } else if (missingGroups.length > 0) {
    status = "missing_key";
  } else if (tool.implementation_status === "catalog_only") {
    status = "partial";
  } else {
    status = "connected";
  }

  const statusHint =
    status === "connected"
      ? "Lista para uso controlado dentro del runtime."
      : status === "partial"
        ? "Tiene llave o base real, pero falta executor completo antes de ejecutar acciones."
        : status === "missing_key"
          ? "Faltan variables de entorno reales."
          : status === "missing_code"
            ? "Falta implementación real en código."
            : "Bloqueada por seguridad o política.";

  return {
    ...tool,
    status,
    status_label: labelForStatus(status),
    status_hint: statusHint,
    configured_env_count: envPresent.length,
    env_present: envPresent,
    missing_env: Array.from(new Set(missingEnv)),
    missing_groups: missingGroups,
    alias_hits: aliasHits,
    execution_enabled: status === "connected" && tool.owner_gate_required !== false,
  };
}

export function getRuntimeToolCatalog(): RuntimeToolStatus[] {
  return TOOL_CATALOG.map(statusFor);
}

export function getRuntimeToolSummary() {
  const tools = getRuntimeToolCatalog();
  return {
    checked_at: new Date().toISOString(),
    counts: {
      total: tools.length,
      connected: tools.filter((tool) => tool.status === "connected").length,
      partial: tools.filter((tool) => tool.status === "partial").length,
      missing_key: tools.filter((tool) => tool.status === "missing_key").length,
      missing_code: tools.filter((tool) => tool.status === "missing_code").length,
      blocked: tools.filter((tool) => tool.status === "blocked").length,
    },
    tools,
  };
}

function getAdminSupabase(): SupabaseClient {
  const url = envValue("SUPABASE_URL") || envValue("NEXT_PUBLIC_SUPABASE_URL");
  const key = envValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase admin no configurado para AGI Runtime.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function safeCount(sb: SupabaseClient, table: string, project_id: string): Promise<{ count: number; ok: boolean; error?: string }> {
  const { count, error } = await sb.from(table).select("*", { count: "exact", head: true }).eq("project_id", project_id);
  if (error) return { count: 0, ok: false, error: error.message };
  return { count: count ?? 0, ok: true };
}

function agentDisplayName(raw: unknown): string {
  const agi = raw as { key?: string; title?: string; name?: string };
  return agi.title ?? agi.name ?? agi.key ?? "AGI";
}

function agentRole(key: string): string {
  if (key === "nova") return "orchestrator";
  if (key === "syntia") return "memory";
  if (key === "vertx") return "security";
  if (key === "curvewind") return "prediction";
  return "agent";
}

function toolKeysForAgent(agentId: string): string[] {
  const baseTools = ["nova_orchestrator", "supabase"];
  const extra =
    agentId === "hostia" ? ["github", "vercel", "cloudflare", "hetzner", "namecheap"] :
    agentId === "nova-ads" ? ["meta_ads", "google_ads", "tiktok_ads", "linkedin_ads"] :
    agentId === "candy-ads" ? ["openai", "gemini"] :
    agentId === "pro-ia" ? ["heygen", "openai", "gemini"] :
    agentId === "numia" ? ["stripe", "paypal"] :
    agentId === "jurix" ? ["github", "supabase"] :
    agentId === "chido-wins" ? ["supabase", "d24"] :
    agentId === "chido-gerente" ? ["supabase", "d24", "paypal"] :
    agentId === "revia" ? ["email", "supabase"] :
    agentId === "nova" ? ["github", "vercel", "meta_ads", "google_ads", "tiktok_ads", "linkedin_ads", "stripe", "paypal", "namecheap", "cloudflare", "hetzner", "openai", "gemini", "trigger", "langfuse", "email"] : [];

  return Array.from(new Set([...baseTools, ...extra]));
}

export async function syncAgiRuntimeCatalog(project_id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getAdminSupabase();
    const now = new Date().toISOString();
    const tools = getRuntimeToolCatalog();

    const agents = AGI_REGISTRY.map((raw) => {
      const agi = raw as { key: string; title?: string; name?: string; description?: string; status?: string; category?: string };
      const key = agi.key;

      return {
        project_id,
        agi_id: key,
        name: agentDisplayName(agi),
        role: agentRole(key),
        status: agi.status ?? "registered",
        autonomy_level: key === "nova" || key === "syntia" || key === "vertx" ? "guarded" : "manual",
        allow_actions: false,
        capabilities: [agi.category ?? "ecosystem"],
        meta: { source: "hocker-dashboard", description: agi.description ?? null },
        created_at: now,
        updated_at: now,
      };
    });

    const toolRows = tools.map((tool) => ({
      tool_key: tool.tool_key,
      name: tool.name,
      provider: tool.provider,
      category: tool.category,
      status: tool.status,
      requires_secret_keys: tool.required_env,
      supports_read: tool.supports_read,
      supports_write: tool.supports_write,
      supports_realtime: tool.supports_realtime,
      meta: {
        safe_note: tool.safe_note,
        optional_env: tool.optional_env ?? [],
        env_groups: tool.env_groups ?? [],
        env_present: tool.env_present,
        missing_env: tool.missing_env,
        status_label: tool.status_label,
        status_hint: tool.status_hint,
        implementation_status: tool.implementation_status,
        owner_gate_required: tool.owner_gate_required,
        dry_run_first: tool.dry_run_first,
        next_step: tool.next_step,
      },
      created_at: now,
      updated_at: now,
    }));

    const toolByKey = new Map(tools.map((tool) => [tool.tool_key, tool]));

    const agentTools = agents.flatMap((agent) =>
      toolKeysForAgent(agent.agi_id).map((tool_key) => {
        const tool = toolByKey.get(tool_key);

        return {
          project_id,
          agi_id: agent.agi_id,
          tool_key,
          permission_level: agent.agi_id === "nova" ? "admin_guarded" : "read_guarded",
          enabled: tool?.status === "connected",
          policy: {
            owner_gate_required: true,
            dry_run_first: true,
            writes_blocked_by_default: true,
            normalized_status: tool?.status ?? "missing_code",
            next_step: tool?.next_step ?? "Registrar herramienta.",
          },
          created_at: now,
          updated_at: now,
        };
      }),
    );

    const a = await sb.from("agi_agents").upsert(agents, { onConflict: "project_id,agi_id" });
    if (a.error) throw a.error;

    const t = await sb.from("agi_tools").upsert(toolRows, { onConflict: "tool_key" });
    if (t.error) throw t.error;

    const at = await sb.from("agi_agent_tools").upsert(agentTools, { onConflict: "project_id,agi_id,tool_key" });
    if (at.error) throw at.error;

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No se pudo sincronizar AGI Runtime." };
  }
}

export async function getAgiRuntimeSummary(project_id: string) {
  const toolSummary = getRuntimeToolSummary();
  const tools = toolSummary.tools;
  const sync = await syncAgiRuntimeCatalog(project_id);

  try {
    const sb = getAdminSupabase();
    const [agents, tasks, runs, actions, feedback, threads] = await Promise.all([
      safeCount(sb, "agi_agents", project_id),
      safeCount(sb, "agi_tasks", project_id),
      safeCount(sb, "agi_runs", project_id),
      safeCount(sb, "agi_action_queue", project_id),
      safeCount(sb, "agi_feedback", project_id),
      safeCount(sb, "agi_chat_threads", project_id),
    ]);

    const { data: recentActions } = await sb
      .from("agi_action_queue")
      .select("id,agi_id,tool_key,action_type,title,status,risk_level,dry_run,created_at")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false })
      .limit(8);

    return {
      ok: true,
      project_id,
      checked_at: new Date().toISOString(),
      schema_ready: [agents, tasks, runs, actions, feedback, threads].every((item) => item.ok),
      catalog_synced: sync.ok,
      sync_error: sync.error ?? null,
      counts: {
        agents: agents.count || AGI_REGISTRY.length,
        tasks: tasks.count,
        runs: runs.count,
        actions: actions.count,
        feedback: feedback.count,
        threads: threads.count,
        tools_total: toolSummary.counts.total,
        tools_configured: toolSummary.counts.connected,
        tools_connected: toolSummary.counts.connected,
        tools_partial: toolSummary.counts.partial,
        tools_missing_key: toolSummary.counts.missing_key,
        tools_missing_code: toolSummary.counts.missing_code,
        tools_blocked: toolSummary.counts.blocked,
        tools_missing: toolSummary.counts.missing_key + toolSummary.counts.missing_code + toolSummary.counts.blocked,
      },
      integrations: tools.map((tool) => ({
        tool_key: tool.tool_key,
        name: tool.name,
        provider: tool.provider,
        category: tool.category,
        status: tool.status,
        status_label: tool.status_label,
        status_hint: tool.status_hint,
        supports_read: tool.supports_read,
        supports_write: tool.supports_write,
        supports_realtime: tool.supports_realtime,
        configured_env_count: tool.configured_env_count,
        env_present: tool.env_present,
        missing_env: tool.missing_env,
        missing_groups: tool.missing_groups,
        safe_note: tool.safe_note,
        next_step: tool.next_step,
        execution_enabled: tool.execution_enabled,
      })),
      recent_actions: recentActions ?? [],
      message: sync.ok
        ? "AGI Runtime normalizado: estados reales, llaves detectadas y herramientas protegidas por Owner Gate."
        : "AGI Runtime definido; falta aplicar migración o configurar Supabase admin.",
    };
  } catch (error) {
    return {
      ok: false,
      project_id,
      checked_at: new Date().toISOString(),
      schema_ready: false,
      catalog_synced: sync.ok,
      sync_error: sync.error ?? null,
      counts: {
        agents: AGI_REGISTRY.length,
        tasks: 0,
        runs: 0,
        actions: 0,
        feedback: 0,
        threads: 0,
        tools_total: toolSummary.counts.total,
        tools_configured: toolSummary.counts.connected,
        tools_connected: toolSummary.counts.connected,
        tools_partial: toolSummary.counts.partial,
        tools_missing_key: toolSummary.counts.missing_key,
        tools_missing_code: toolSummary.counts.missing_code,
        tools_blocked: toolSummary.counts.blocked,
        tools_missing: toolSummary.counts.missing_key + toolSummary.counts.missing_code + toolSummary.counts.blocked,
      },
      integrations: tools,
      recent_actions: [],
      message: error instanceof Error ? error.message : "No se pudo leer AGI Runtime.",
    };
  }
}

export async function enqueueAgiAction(input: {
  project_id: string;
  agi_id: string;
  tool_key?: string | null;
  action_type: string;
  title: string;
  payload?: JsonObject;
  risk_level?: string;
  dry_run?: boolean;
  requires_approval?: boolean;
  created_by?: string | null;
}) {
  const sb = getAdminSupabase();
  const dryRun = input.dry_run ?? true;
  const requiresApproval = input.requires_approval ?? true;
  const status = requiresApproval ? "needs_approval" : dryRun ? "dry_run_queued" : "queued";

  const row = {
    project_id: input.project_id,
    agi_id: input.agi_id,
    tool_key: input.tool_key ?? null,
    action_type: input.action_type,
    title: input.title,
    payload: input.payload ?? {},
    risk_level: input.risk_level ?? "medium",
    dry_run: dryRun,
    requires_approval: requiresApproval,
    status,
    created_by: input.created_by ?? null,
  };

  const { data, error } = await sb.from("agi_action_queue").insert(row).select("*").single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo crear acción AGI.");
  return data;
}
