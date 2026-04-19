import { createServerSupabase } from "@/lib/supabase-server";
import { resolveExternalServices } from "@/lib/external-services";
import type {
  DashboardCommandItem,
  DashboardEventItem,
  DashboardMetric,
  DashboardSummary,
} from "@/lib/hocker-dashboard";
import { APP_REGISTRY, AGI_REGISTRY, REPO_REGISTRY, getAppStatus, getNodeStatus } from "@/lib/hocker-dashboard";

type SnapshotRow = {
  total_projects?: number | null;
  total_nodes?: number | null;
  total_commands?: number | null;
  total_events?: number | null;
  total_orders?: number | null;
  total_cents?: number | null;
};

type ProjectRow = {
  id: string;
  name?: string | null;
  created_at?: string | null;
};

type NodeRow = {
  id: string;
  project_id: string;
  name?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

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

type OrderRow = {
  id: string;
  project_id: string;
  status?: string | null;
  total_cents?: number | null;
  created_at: string;
};

function moneyFromCents(totalCents: number): string {
  return `$${(totalCents / 100).toFixed(2)}`;
}

export async function buildDashboardSummary(): Promise<DashboardSummary> {
  const sb = await createServerSupabase();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    snapshotRes,
    projectsRes,
    nodesRes,
    eventsRes,
    commandsRes,
    ordersRes,
    servicesRes,
  ] = await Promise.all([
    sb.from("hocker_dashboard_snapshot").select("*").maybeSingle(),
    sb.from("projects").select("id,name,created_at"),
    sb.from("nodes").select("id,project_id,name,status,updated_at"),
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
    sb.from("supply_orders").select("id,project_id,status,total_cents,created_at"),
    resolveExternalServices(),
  ]);

  const snapshot = (snapshotRes.data ?? {}) as SnapshotRow;
  const projects = (projectsRes.data ?? []) as ProjectRow[];
  const nodes = (nodesRes.data ?? []) as NodeRow[];
  const events = (eventsRes.data ?? []) as EventRow[];
  const commands = (commandsRes.data ?? []) as CommandRow[];
  const orders = (ordersRes.data ?? []) as OrderRow[];

  const projectIds = new Set(projects.map((p) => p.id));
  const activeNodeProjects = new Set(nodes.map((n) => n.project_id));

  const apps = APP_REGISTRY.map((item) => ({
    ...item,
    status: projectIds.has(item.projectId) ? "live" : getAppStatus(item.status),
  }));

  const agis = AGI_REGISTRY.map((item) => ({
    ...item,
    status: activeNodeProjects.has(item.key) || activeNodeProjects.has(item.nodeId) ? "live" : getNodeStatus(item.status),
  }));

  const totalOrdersCents =
    snapshot.total_cents ??
    orders.reduce((sum, order) => sum + (Number(order.total_cents ?? 0) || 0), 0);

  const metrics: DashboardMetric[] = [
    {
      label: "Proyectos",
      value: String(snapshot.total_projects ?? projects.length),
      hint: "Apps registradas",
    },
    {
      label: "Nodos vivos",
      value: String(snapshot.total_nodes ?? nodes.filter((n) => n.status === "online").length),
      hint: "Señal activa",
    },
    {
      label: "Eventos 24h",
      value: String(snapshot.total_events ?? events.length),
      hint: "Actividad real",
    },
    {
      label: "Movimientos",
      value: moneyFromCents(Number(totalOrdersCents || 0)),
      hint: "Flujo económico",
    },
  ];

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
    status: command.status ?? "queued",
    createdAt: command.created_at,
  }));

  return {
    snapshotAt: new Date().toISOString(),
    metrics,
    apps,
    agis,
    repos: REPO_REGISTRY,
    services: servicesRes,
    recentEvents,
    recentCommands,
  };
}