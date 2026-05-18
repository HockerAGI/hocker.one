import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AGI_REGISTRY } from "@/lib/hocker-dashboard";

type RuntimeStatus = "configured" | "missing";
type JsonObject = Record<string, unknown>;

type RuntimeTool = {
  tool_key: string;
  name: string;
  provider: string;
  category: "core" | "code" | "data" | "cloud" | "ads" | "payments" | "domain" | "security" | "media";
  required_env: string[];
  optional_env?: string[];
  supports_read: boolean;
  supports_write: boolean;
  supports_realtime: boolean;
  safe_note: string;
};

type RuntimeToolStatus = RuntimeTool & {
  status: RuntimeStatus;
  configured_env_count: number;
  missing_env: string[];
};

const TOOL_CATALOG: RuntimeTool[] = [
  { tool_key: "nova_orchestrator", name: "NOVA Orquestador", provider: "NOVA", category: "core", required_env: ["NOVA_AGI_URL", "NOVA_ORCHESTRATOR_KEY"], supports_read: true, supports_write: true, supports_realtime: true, safe_note: "Chat, criterio, ruteo y decisiones bajo control." },
  { tool_key: "supabase", name: "Supabase", provider: "Supabase", category: "data", required_env: ["SUPABASE_SERVICE_ROLE_KEY"], optional_env: ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"], supports_read: true, supports_write: true, supports_realtime: true, safe_note: "Datos, memoria, tareas, auditoría y estado." },
  { tool_key: "github", name: "GitHub", provider: "GitHub", category: "code", required_env: ["GITHUB_TOKEN"], optional_env: ["GH_TOKEN", "GITHUB_APP_ID", "GITHUB_INSTALLATION_ID"], supports_read: true, supports_write: true, supports_realtime: false, safe_note: "Repos, commits, ramas y revisión de código." },
  { tool_key: "vercel", name: "Vercel", provider: "Vercel", category: "cloud", required_env: ["VERCEL_TOKEN"], optional_env: ["VERCEL_PROJECT_ID", "VERCEL_TEAM_ID"], supports_read: true, supports_write: true, supports_realtime: false, safe_note: "Deploys, dominios, logs y estado de producción." },
  { tool_key: "meta_ads", name: "Meta Ads", provider: "Meta", category: "ads", required_env: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"], optional_env: ["META_APP_ID"], supports_read: true, supports_write: true, supports_realtime: false, safe_note: "Campañas, audiencias, anuncios y reportes." },
  { tool_key: "google_ads", name: "Google Ads", provider: "Google", category: "ads", required_env: ["GOOGLE_ADS_DEVELOPER_TOKEN"], optional_env: ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN"], supports_read: true, supports_write: true, supports_realtime: false, safe_note: "Campañas, búsqueda, performance y reportes." },
  { tool_key: "openai", name: "OpenAI", provider: "OpenAI", category: "core", required_env: ["OPENAI_API_KEY"], supports_read: true, supports_write: false, supports_realtime: true, safe_note: "Modelo, razonamiento, visión, archivos y herramientas según backend." },
  { tool_key: "gemini", name: "Gemini", provider: "Google", category: "core", required_env: ["GEMINI_API_KEY"], supports_read: true, supports_write: false, supports_realtime: true, safe_note: "Modelo alterno, análisis multimodal y razonamiento según backend." },
  { tool_key: "stripe", name: "Stripe", provider: "Stripe", category: "payments", required_env: ["STRIPE_SECRET_KEY"], optional_env: ["STRIPE_WEBHOOK_SECRET"], supports_read: true, supports_write: true, supports_realtime: false, safe_note: "Pagos, clientes, facturación y eventos." },
  { tool_key: "paypal", name: "PayPal", provider: "PayPal", category: "payments", required_env: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"], supports_read: true, supports_write: true, supports_realtime: false, safe_note: "Pagos, órdenes, capturas y estado." },
  { tool_key: "namecheap", name: "Namecheap", provider: "Namecheap", category: "domain", required_env: ["NAMECHEAP_API_USER", "NAMECHEAP_API_KEY"], optional_env: ["NAMECHEAP_USERNAME", "NAMECHEAP_CLIENT_IP"], supports_read: true, supports_write: true, supports_realtime: false, safe_note: "Dominios y disponibilidad." },
  { tool_key: "cloudflare", name: "Cloudflare", provider: "Cloudflare", category: "security", required_env: ["CLOUDFLARE_API_TOKEN"], optional_env: ["CLOUDFLARE_ZONE_ID"], supports_read: true, supports_write: true, supports_realtime: false, safe_note: "DNS, seguridad, cache y reglas." },
  { tool_key: "hetzner", name: "Hetzner", provider: "Hetzner", category: "cloud", required_env: ["HETZNER_TOKEN"], supports_read: true, supports_write: true, supports_realtime: false, safe_note: "Servidor, red, backups y health." },
  { tool_key: "heygen", name: "HeyGen", provider: "HeyGen", category: "media", required_env: ["HEYGEN_API_KEY"], supports_read: true, supports_write: true, supports_realtime: false, safe_note: "Videos, avatares y assets." },
];

function envValue(key: string): string {
  return String(process.env[key] ?? "").trim();
}

function hasEnv(key: string): boolean {
  return envValue(key).length > 0;
}

function statusFor(tool: RuntimeTool): RuntimeToolStatus {
  const missing = tool.required_env.filter((key) => !hasEnv(key));
  const configuredRequired = tool.required_env.length - missing.length;
  const configuredOptional = (tool.optional_env ?? []).filter(hasEnv).length;
  return {
    ...tool,
    status: missing.length === 0 ? "configured" : "missing",
    configured_env_count: configuredRequired + configuredOptional,
    missing_env: missing,
  };
}

export function getRuntimeToolCatalog(): RuntimeToolStatus[] {
  return TOOL_CATALOG.map(statusFor);
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

export async function syncAgiRuntimeCatalog(project_id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getAdminSupabase();
    const now = new Date().toISOString();

    const agents = AGI_REGISTRY.map((raw) => {
      const agi = raw as { key: string; title?: string; name?: string; description?: string; status?: string; category?: string };
      const key = agi.key;
      return {
        project_id,
        agi_id: key,
        name: agi.title ?? agi.name ?? key,
        role: key === "nova" ? "orchestrator" : key === "syntia" ? "memory" : key === "vertx" ? "security" : "agent",
        status: agi.status ?? "registered",
        autonomy_level: key === "nova" || key === "syntia" || key === "vertx" ? "guarded" : "manual",
        allow_actions: false,
        capabilities: [agi.category ?? "ecosystem"],
        meta: { source: "hocker-dashboard", description: agi.description ?? null },
        created_at: now,
        updated_at: now,
      };
    });

    const tools = TOOL_CATALOG.map((tool) => ({
      tool_key: tool.tool_key,
      name: tool.name,
      provider: tool.provider,
      category: tool.category,
      status: statusFor(tool).status,
      requires_secret_keys: tool.required_env,
      supports_read: tool.supports_read,
      supports_write: tool.supports_write,
      supports_realtime: tool.supports_realtime,
      meta: { safe_note: tool.safe_note, optional_env: tool.optional_env ?? [] },
      created_at: now,
      updated_at: now,
    }));

    const agentTools = agents.flatMap((agent) => {
      const baseTools = ["nova_orchestrator", "supabase"];
      const extra =
        agent.agi_id === "hostia" ? ["github", "vercel", "cloudflare", "hetzner", "namecheap"] :
        agent.agi_id === "nova-ads" ? ["meta_ads", "google_ads"] :
        agent.agi_id === "candy-ads" ? ["openai", "gemini"] :
        agent.agi_id === "pro-ia" ? ["heygen", "openai", "gemini"] :
        agent.agi_id === "numia" ? ["stripe", "paypal"] :
        agent.agi_id === "jurix" ? ["github", "supabase"] :
        agent.agi_id === "nova" ? ["github", "vercel", "meta_ads", "google_ads", "stripe", "paypal", "namecheap", "cloudflare", "hetzner", "openai", "gemini"] : [];

      return Array.from(new Set([...baseTools, ...extra])).map((tool_key) => ({
        project_id,
        agi_id: agent.agi_id,
        tool_key,
        permission_level: agent.agi_id === "nova" ? "admin_guarded" : "read_guarded",
        enabled: statusFor(TOOL_CATALOG.find((tool) => tool.tool_key === tool_key) ?? TOOL_CATALOG[0]).status === "configured",
        policy: { owner_gate_required: true, dry_run_first: true, writes_blocked_by_default: true },
        created_at: now,
        updated_at: now,
      }));
    });

    const a = await sb.from("agi_agents").upsert(agents, { onConflict: "project_id,agi_id" });
    if (a.error) throw a.error;
    const t = await sb.from("agi_tools").upsert(tools, { onConflict: "tool_key" });
    if (t.error) throw t.error;
    const at = await sb.from("agi_agent_tools").upsert(agentTools, { onConflict: "project_id,agi_id,tool_key" });
    if (at.error) throw at.error;

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No se pudo sincronizar AGI Runtime." };
  }
}

export async function getAgiRuntimeSummary(project_id: string) {
  const tools = getRuntimeToolCatalog();
  const sync = await syncAgiRuntimeCatalog(project_id);
  const configured = tools.filter((tool) => tool.status === "configured").length;
  const missing = tools.length - configured;

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
        tools_total: tools.length,
        tools_configured: configured,
        tools_missing: missing,
      },
      integrations: tools.map((tool) => ({
        tool_key: tool.tool_key,
        name: tool.name,
        provider: tool.provider,
        category: tool.category,
        status: tool.status,
        supports_read: tool.supports_read,
        supports_write: tool.supports_write,
        supports_realtime: tool.supports_realtime,
        configured_env_count: tool.configured_env_count,
        missing_env: tool.missing_env,
        safe_note: tool.safe_note,
      })),
      recent_actions: recentActions ?? [],
      message: sync.ok
        ? "AGI Runtime listo para operar con Owner Gate, dry-run y herramientas configurables."
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
      counts: { agents: AGI_REGISTRY.length, tasks: 0, runs: 0, actions: 0, feedback: 0, threads: 0, tools_total: tools.length, tools_configured: configured, tools_missing: missing },
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
