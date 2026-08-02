import { getRuntimeToolCatalog } from "@/lib/agi-runtime-core";
import { resolveExternalServices } from "@/lib/external-services";
import { createAdminSupabase } from "@/lib/supabase-admin";

export type VerifiedServiceStatus = "online" | "configured" | "offline" | "unknown";

export type VerifiedServiceState = {
  status: VerifiedServiceStatus;
  checked_at: string;
  last_verified_at: string | null;
  detail: string;
};

type IntegrationCheckRow = {
  tool_key: string;
  status: string | null;
  configured: boolean | null;
  last_checked_at: string | null;
  latency_ms: number | null;
  message: string | null;
};

type AgentRow = { agi_id: string };

type CountResult = { count: number; ok: boolean };

const VERIFIED_CHECK_MAX_AGE_MS = 10 * 60 * 1000;

function isFresh(value: string | null | undefined, maxAgeMs = VERIFIED_CHECK_MAX_AGE_MS): boolean {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && Date.now() - timestamp <= maxAgeMs;
}

function canonicalAgiId(value: string): string {
  return value.trim().toLowerCase().replaceAll("_", "-")
    .replace(/^candy$/, "candy-ads")
    .replace(/^nexpa$/, "nexpa-agi")
    .replace(/^trackhok$/, "trackhok-agi");
}

async function safeCount(table: string, projectId: string): Promise<CountResult> {
  try {
    const sb = createAdminSupabase();
    const { count, error } = await sb
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    return { count: error ? 0 : count ?? 0, ok: !error };
  } catch {
    return { count: 0, ok: false };
  }
}

export async function getVerifiedAgiRuntimeSummary(projectId: string) {
  const checkedAt = new Date().toISOString();
  const catalog = getRuntimeToolCatalog();

  let databaseOnline = false;
  let agentRows: AgentRow[] = [];
  let checks: IntegrationCheckRow[] = [];

  try {
    const sb = createAdminSupabase();
    const [agentsRes, checksRes] = await Promise.all([
      sb.from("agi_agents").select("agi_id").eq("project_id", projectId),
      sb
        .from("agi_integration_checks")
        .select("tool_key,status,configured,last_checked_at,latency_ms,message")
        .eq("project_id", projectId)
        .order("last_checked_at", { ascending: false }),
    ]);

    if (!agentsRes.error) {
      databaseOnline = true;
      agentRows = (agentsRes.data ?? []) as AgentRow[];
    }
    if (!checksRes.error) checks = (checksRes.data ?? []) as IntegrationCheckRow[];
  } catch {
    databaseOnline = false;
  }

  const externalServices = await resolveExternalServices().catch(() => []);
  const novaService = externalServices.find((service) => service.key === "nova.agi");

  const novaState: VerifiedServiceState = novaService
    ? {
        status: novaService.status === "live" ? "online" : novaService.status === "offline" ? "offline" : "configured",
        checked_at: novaService.lastCheckedAt,
        last_verified_at: novaService.status === "live" ? novaService.lastCheckedAt : null,
        detail:
          novaService.status === "live"
            ? "El endpoint /health respondió correctamente."
            : novaService.status === "offline"
              ? "El endpoint configurado no respondió al health check."
              : "La URL de NOVA no está configurada para verificación.",
      }
    : {
        status: "unknown",
        checked_at: checkedAt,
        last_verified_at: null,
        detail: "No se pudo ejecutar el health check de NOVA.",
      };

  const supabaseState: VerifiedServiceState = {
    status: databaseOnline ? "online" : "offline",
    checked_at: checkedAt,
    last_verified_at: databaseOnline ? checkedAt : null,
    detail: databaseOnline
      ? "Consulta autenticada de lectura completada."
      : "No se pudo completar una consulta autenticada de lectura.",
  };

  const latestCheckByTool = new Map<string, IntegrationCheckRow>();
  for (const check of checks) {
    if (!latestCheckByTool.has(check.tool_key)) latestCheckByTool.set(check.tool_key, check);
  }

  const integrations = catalog.map((tool) => {
    const persistedCheck = latestCheckByTool.get(tool.tool_key);
    const checkVerified = Boolean(
      persistedCheck &&
      isFresh(persistedCheck.last_checked_at) &&
      ["connected", "online", "ok", "healthy", "live"].includes(String(persistedCheck.status ?? "").toLowerCase()),
    );

    const envConfigured = tool.status === "connected" || tool.status === "configured";
    const isNova = tool.tool_key === "nova_orchestrator";
    const isSupabase = tool.tool_key === "supabase";
    const verified = checkVerified || (isNova && novaState.status === "online") || (isSupabase && databaseOnline);

    const status = verified
      ? "connected"
      : envConfigured
        ? "configured"
        : tool.status === "partial"
          ? "partial"
          : tool.status;

    const lastVerifiedAt = checkVerified
      ? persistedCheck?.last_checked_at ?? null
      : isNova
        ? novaState.last_verified_at
        : isSupabase
          ? supabaseState.last_verified_at
          : null;

    return {
      ...tool,
      status,
      status_label:
        status === "connected"
          ? "Verificada"
          : status === "configured"
            ? "Configurada"
            : tool.status_label,
      status_hint:
        status === "connected"
          ? "Conexión comprobada mediante health check o consulta real reciente."
          : status === "configured"
            ? "Hay configuración, pero no una verificación operativa reciente."
            : tool.status_hint,
      verified,
      last_verified_at: lastVerifiedAt,
      latency_ms: checkVerified ? persistedCheck?.latency_ms ?? null : null,
      check_message: persistedCheck?.message ?? null,
      execution_enabled: Boolean(verified && tool.execution_enabled),
    };
  });

  const [tasks, runs, actions, feedback, threads] = await Promise.all([
    safeCount("agi_tasks", projectId),
    safeCount("agi_runs", projectId),
    safeCount("agi_action_queue", projectId),
    safeCount("agi_feedback", projectId),
    safeCount("agi_chat_threads", projectId),
  ]);

  const canonicalAgents = new Set(agentRows.map((row) => canonicalAgiId(row.agi_id)));
  const connected = integrations.filter((tool) => tool.status === "connected").length;
  const configured = integrations.filter((tool) => ["connected", "configured"].includes(tool.status)).length;
  const partial = integrations.filter((tool) => tool.status === "partial").length;

  return {
    ok: databaseOnline,
    project_id: projectId,
    checked_at: checkedAt,
    schema_ready: databaseOnline && [tasks, runs, actions, feedback, threads].every((item) => item.ok),
    catalog_synced: false,
    sync_error: null,
    counts: {
      agents: canonicalAgents.size,
      tasks: tasks.count,
      runs: runs.count,
      actions: actions.count,
      feedback: feedback.count,
      threads: threads.count,
      tools_total: integrations.length,
      tools_configured: configured,
      tools_connected: connected,
      tools_partial: partial,
      tools_missing_key: integrations.filter((tool) => tool.status === "missing_key").length,
      tools_missing_code: integrations.filter((tool) => tool.status === "missing_code").length,
      tools_blocked: integrations.filter((tool) => tool.status === "blocked").length,
      tools_missing: integrations.filter((tool) => ["missing", "missing_key", "missing_code", "blocked"].includes(tool.status)).length,
    },
    service_status: {
      nova: novaState,
      supabase: supabaseState,
    },
    integrations,
    recent_actions: [],
    message: databaseOnline
      ? "Estado actualizado: configuración y conexión verificada se muestran por separado."
      : "No fue posible verificar Supabase; los estados se muestran como configuración no confirmada.",
  };
}
