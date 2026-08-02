import { createServerSupabase } from "@/lib/supabase-server";
import { resolveExternalServices } from "@/lib/external-services";
import { getHockerOperationalSnapshot, type OperationalStatus } from "@/lib/hocker-operational-state";
import type {
  AppStatus,
  DashboardCommandItem,
  DashboardEventItem,
  DashboardSummary,
} from "@/lib/hocker-dashboard";
import {
  APP_REGISTRY,
  AGI_REGISTRY,
  REPO_REGISTRY,
} from "@/lib/hocker-dashboard";

type EventRow = {
  id: string;
  project_id: string;
  level?: string | null;
  type?: string | null;
  message?: string | null;
  created_at: string;
};

type CommandRow = {
  id: string;
  project_id: string;
  command?: string | null;
  status?: string | null;
  created_at: string;
};

type DashboardCommandStatus = DashboardCommandItem["status"];

function normalizeCommandStatus(value?: string | null): DashboardCommandStatus {
  switch (value) {
    case "done":
    case "running":
    case "queued":
    case "needs_approval":
    case "error":
    case "canceled":
      return value;
    default:
      return "queued";
  }
}

function legacyStatus(status: OperationalStatus): AppStatus {
  switch (status) {
    case "online": return "live";
    case "protected": return "protected";
    case "configured": return "integration";
    case "degraded":
    case "offline": return "blocked";
    case "not_created": return "not_created";
    case "stale":
    case "planned":
    case "unknown":
    default: return "pending";
  }
}

export async function buildDashboardSummary(): Promise<DashboardSummary> {
  const sb = await createServerSupabase();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const operational = await getHockerOperationalSnapshot();

  const [eventsRes, commandsRes, servicesRes] = await Promise.all([
    sb
      .from("events")
      .select("id,project_id,level,type,message,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(12),
    sb
      .from("commands")
      .select("id,project_id,command,status,created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    resolveExternalServices(),
  ]);

  const events = (eventsRes.data ?? []) as EventRow[];
  const commands = (commandsRes.data ?? []) as CommandRow[];
  const appState = new Map(operational.apps.map((item) => [item.key, item]));
  const agiState = new Map(operational.agis.map((item) => [item.key, item]));

  const apps = APP_REGISTRY.map((item) => {
    const state = appState.get(item.key);
    return {
      ...item,
      status: state ? legacyStatus(state.status) : "pending" as AppStatus,
      note: state?.evidence ?? "Sin comprobación operativa disponible.",
    };
  });

  const agis = AGI_REGISTRY.map((item) => {
    const state = agiState.get(item.key);
    return {
      ...item,
      status: state ? legacyStatus(state.status) : "pending" as AppStatus,
      note: state?.evidence ?? "Sin comprobación operativa disponible.",
    };
  });

  const recentEvents: DashboardEventItem[] = events.map((event) => ({
    id: event.id,
    title: event.type ?? "event",
    detail: event.message ?? "Evento registrado.",
    level: event.level === "error" ? "error" : event.level === "warn" ? "warn" : "info",
    at: event.created_at,
  }));

  const recentCommands: DashboardCommandItem[] = commands.map((command) => ({
    id: command.id,
    command: command.command ?? "command",
    projectId: command.project_id,
    status: normalizeCommandStatus(command.status),
    createdAt: command.created_at,
  }));

  return {
    snapshotAt: operational.checked_at,
    metrics: [
      {
        label: "Servicios verificados",
        value: String(operational.metrics.verified_services),
        hint: "Health check o consulta real",
      },
      {
        label: "Nodos con señal",
        value: String(operational.metrics.fresh_nodes),
        hint: "Últimos 5 minutos",
      },
      {
        label: "Ejecuciones 24h",
        value: String(operational.metrics.runs_24h),
        hint: "Runs realmente registrados",
      },
      {
        label: "Por aprobar",
        value: String(operational.metrics.pending_actions),
        hint: "Acciones bloqueantes",
      },
    ],
    apps,
    agis,
    repos: REPO_REGISTRY.map((repo) => ({
      ...repo,
      status: "pending" as const,
      note: "Repositorio conocido; estado en vivo no verificado desde esta vista.",
    })),
    services: servicesRes,
    recentEvents,
    recentCommands,
  };
}
