import { createServerSupabase } from "@/lib/supabase-server";
import { resolveExternalServices } from "@/lib/external-services";
import type { DashboardSummary, DashboardMetric, DashboardEventItem, DashboardCommandItem } from "@/lib/hocker-dashboard";
import { APP_REGISTRY, AGI_REGISTRY, REPO_REGISTRY } from "@/lib/hocker-dashboard";

export async function buildDashboardSummary(): Promise<DashboardSummary> {
  const sb = await createServerSupabase();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [snapshotRes, projectsRes, nodesRes, eventsRes, commandsRes, ordersRes, servicesRes] = await Promise.all([
    sb.from("hocker_dashboard_snapshot").select("*").maybeSingle(),
    sb.from("projects").select("id,name,created_at"),
    sb.from("nodes").select("id,project_id,name,status"),
    sb.from("events").select("id,project_id,level,type,message,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(12),
    sb.from("commands").select("id,project_id,command,status,created_at").order("created_at", { ascending: false }).limit(12),
    sb.from("supply_orders").select("id,project_id,status,total_cents,created_at"),
    resolveExternalServices(),
  ]);

  const projects = projectsRes.data ?? [];
  const nodes = nodesRes.data ?? [];
  const projectIds = new Set(projects.map((p: any) => p.id));

  const apps = APP_REGISTRY.map(item => ({
    ...item,
    status: projectIds.has(item.projectId ?? item.key) ? "live" : item.status
  }));

  const agis = AGI_REGISTRY.map(item => ({
    ...item,
    status: projectIds.has(item.projectId ?? item.key) ? "live" : item.status
  }));

  const metrics: DashboardMetric[] = [
    { label: "Proyectos", value: String(snapshotRes.data?.total_projects ?? projects.length), hint: "Apps registradas" },
    { label: "Nodos vivos", value: String(nodes.filter((n: any) => n.status === "online").length), hint: "Señal activa" },
    { label: "Eventos 24h", value: String(eventsRes.data?.length ?? 0), hint: "Actividad real" },
    { label: "Movimientos", value: `$${((ordersRes.data?.reduce((s: number, o: any) => s + (o.total_cents || 0), 0) || 0) / 100).toFixed(2)}`, hint: "Flujo económico" }
  ];

  return {
    snapshotAt: new Date().toISOString(),
    metrics,
    apps,
    agis,
    repos: REPO_REGISTRY,
    services: servicesRes,
    recentEvents: (eventsRes.data ?? []).map((e: any) => ({
      id: e.id, title: e.type, detail: e.message, level: e.level === "error" ? "error" : e.level === "warn" ? "warn" : "info", at: e.created_at
    })),
    recentCommands: (commandsRes.data ?? []).map((c: any) => ({
      id: c.id, command: c.command, projectId: c.project_id, status: c.status, createdAt: c.created_at
    }))
  };
}
