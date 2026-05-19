import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AGI_REGISTRY } from "@/lib/hocker-dashboard";

export type RuntimeToolStatusKind = "configured" | "connected" | "partial" | "missing" | "blocked" | "missing_key" | "missing_code";

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

type RuntimeToolImplementation = "executor_ready" | "code_only" | "partial_env_detected" | "missing_credentials" | "missing_key" | "missing_code" | "configured" | "connected" | "partial" | "missing" | "blocked";

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
  { tool_key: "nova_orchestrator", name: "NOVA Orquestador", provider: "NOVA", category: "core", required_env: ["NOVA_AGI_URL", "NOVA_ORCHESTRATOR_KEY"], supports_read: true, supports_write: true, supports_realtime: true, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Chat, criterio, ruteo y decisiones bajo control." },
  { tool_key: "supabase", name: "Supabase", provider: "Supabase", category: "data", required_env: ["SUPABASE_SERVICE_ROLE_KEY"], optional_env: ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"], supports_read: true, supports_write: true, supports_realtime: true, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Datos, memoria, tareas, auditoría y estado." },
  { tool_key: "github", name: "GitHub", provider: "GitHub", category: "code", required_env: ["HOCKER_GITHUB_TOKEN"], optional_env: ["GITHUB_TOKEN", "GH_TOKEN", "GITHUB_APP_ID", "GITHUB_INSTALLATION_ID"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Repos, commits, ramas y revisión de código. Escritura solo con Owner Gate." },
  { tool_key: "vercel", name: "Vercel", provider: "Vercel", category: "cloud", required_env: ["VERCEL_TOKEN"], optional_env: ["VERCEL_PROJECT_ID", "VERCEL_ORG_ID", "VERCEL_TEAM_ID", "VERCEL_OIDC_TOKEN"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Deploys, dominios, logs y estado de producción. OIDC cuenta como señal parcial." },
  { tool_key: "trigger", name: "Trigger.dev", provider: "Trigger.dev", category: "core", required_env: ["TRIGGER_SECRET_KEY"], optional_env: ["TRIGGER_API_KEY"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Jobs, tareas programadas y ejecución controlada." },
  { tool_key: "langfuse", name: "Langfuse", provider: "Langfuse", category: "security", required_env: ["LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"], optional_env: ["LANGFUSE_HOST", "LANGFUSE_BASE_URL"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Trazas, auditoría, evaluación y observabilidad." },
  { tool_key: "openai", name: "OpenAI", provider: "OpenAI", category: "core", required_env: ["OPENAI_API_KEY"], supports_read: true, supports_write: false, supports_realtime: true, dry_run_first: false, owner_gate_required: false, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Modelo, razonamiento, visión, archivos y herramientas según backend." },
  { tool_key: "gemini", name: "Gemini", provider: "Google", category: "core", required_env: ["GEMINI_API_KEY"], optional_env: ["GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"], supports_read: true, supports_write: false, supports_realtime: true, dry_run_first: false, owner_gate_required: false, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Modelo alterno, análisis multimodal y razonamiento según backend." },
  { tool_key: "meta_ads", name: "Meta Ads", provider: "Meta", category: "ads", required_env: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"], optional_env: ["FACEBOOK_ACCESS_TOKEN", "META_APP_ID", "META_APP_SECRET"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Campañas, audiencias, anuncios y reportes." },
  { tool_key: "google_ads", name: "Google Ads", provider: "Google", category: "ads", required_env: ["GOOGLE_ADS_DEVELOPER_TOKEN"], optional_env: ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Campañas, búsqueda, performance y reportes." },
  { tool_key: "tiktok_ads", name: "TikTok Ads", provider: "TikTok", category: "ads", required_env: ["TIKTOK_ACCESS_TOKEN"], optional_env: ["TIKTOK_APP_ID", "TIKTOK_SECRET", "TIKTOK_ADVERTISER_ID"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Campañas TikTok, creatividades y reportes." },
  { tool_key: "linkedin_ads", name: "LinkedIn Ads", provider: "LinkedIn", category: "ads", required_env: ["LINKEDIN_ACCESS_TOKEN"], optional_env: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Campañas B2B, audiencias y reportes." },
  { tool_key: "stripe", name: "Stripe", provider: "Stripe", category: "payments", required_env: ["STRIPE_SECRET_KEY"], optional_env: ["STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Pagos, clientes, facturación y eventos." },
  { tool_key: "paypal", name: "PayPal", provider: "PayPal", category: "payments", required_env: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"], optional_env: ["PAYPAL_WEBHOOK_ID"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Pagos, órdenes, capturas y estado." },
  { tool_key: "d24", name: "D24", provider: "D24", category: "payments", required_env: ["D24_API_KEY", "D24_SECRET_KEY"], optional_env: ["D24_MERCHANT_ID"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Pasarela de pagos para Chido Casino. Pendiente de credenciales reales." },
  { tool_key: "namecheap", name: "Namecheap", provider: "Namecheap", category: "domain", required_env: ["NAMECHEAP_API_USER", "NAMECHEAP_API_KEY"], optional_env: ["NAMECHEAP_USERNAME", "NAMECHEAP_CLIENT_IP"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Dominios y disponibilidad." },
  { tool_key: "cloudflare", name: "Cloudflare", provider: "Cloudflare", category: "security", required_env: ["CLOUDFLARE_API_TOKEN"], optional_env: ["CLOUDFLARE_ZONE_ID", "CF_API_TOKEN"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "DNS, seguridad, cache y reglas." },
  { tool_key: "hetzner", name: "Hetzner", provider: "Hetzner", category: "cloud", required_env: ["HETZNER_TOKEN"], optional_env: ["HCLOUD_TOKEN", "HETZNER_API_TOKEN"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Servidor, red, backups y health." },
  { tool_key: "heygen", name: "HeyGen", provider: "HeyGen", category: "media", required_env: ["HEYGEN_API_KEY"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Videos, avatares y assets." },
  { tool_key: "email", name: "Email / Resend / SMTP", provider: "Email", category: "core", required_env: ["RESEND_API_KEY"], optional_env: ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"], supports_read: true, supports_write: true, supports_realtime: false, dry_run_first: true, owner_gate_required: true, implementation_status: "code_only", next_step: "Validar credenciales, permisos y executor real antes de permitir ejecución.", safe_note: "Alertas owner y notificaciones transaccionales." },
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
  const missing = tool.required_env.filter((key) => !hasEnv(key));
  const configuredRequired = tool.required_env.length - missing.length;
  const optionalHits = (tool.optional_env ?? []).filter(hasEnv);
  const configuredOptional = optionalHits.length;
  const hasRequired = missing.length === 0;
  const hasAnySignal = configuredRequired > 0 || configuredOptional > 0;

  const status: RuntimeToolStatusKind = hasRequired ? "configured" : hasAnySignal ? "partial" : "missing";

  return {
    status_label: hasRequired ? "Conectado" : hasAnySignal ? "Parcial" : "Falta llave",
    status_hint: hasRequired ? "Variables mínimas detectadas. Lista para validación controlada." : hasAnySignal ? "Hay señales parciales. Falta completar credenciales o permisos." : "Sin variables reales suficientes para ejecutar.",
    env_present: [],
    alias_hits: {},
    missing_groups: [],
    execution_enabled: Boolean(hasRequired && ((tool.implementation_status ?? "code_only") === "executor_ready" || (tool.implementation_status ?? "code_only") === "configured" || (tool.implementation_status ?? "code_only") === "connected")),
    ...tool,
    status,
    configured_env_count: configuredRequired + configuredOptional,
    missing_env: missing,
    implementation_status:
      tool.implementation_status ??
      (hasRequired ? "executor_ready" : hasAnySignal ? "partial_env_detected" : "missing_credentials"),
    owner_gate_required: tool.owner_gate_required ?? tool.supports_write,
    dry_run_first: tool.dry_run_first ?? true,
    next_step:
      tool.next_step ??
      (hasRequired
        ? "Listo para prueba controlada en dry-run."
        : hasAnySignal
          ? `Completar configuración faltante: ${missing.join(", ")}.`
          : `Configurar credenciales: ${tool.required_env.join(", ")}.`),
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
        owner_gate_required: tool.owner_gate_required ?? Boolean(tool.supports_write),
        dry_run_first: tool.dry_run_first ?? Boolean(tool.supports_write),
        next_step: tool.next_step ?? "Validar credenciales, permisos y executor real antes de permitir ejecución.",
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
        next_step: tool.next_step ?? "Validar credenciales, permisos y executor real antes de permitir ejecución.",
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
