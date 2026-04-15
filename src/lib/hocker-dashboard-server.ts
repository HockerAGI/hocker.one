import { createServerSupabase } from "@/lib/supabase-server";
import { resolveExternalServices } from "@/lib/external-services";
import type { DashboardSummary } from "@/lib/hocker-dashboard";
import { APP_REGISTRY, AGI_REGISTRY, REPO_REGISTRY } from "@/lib/hocker-dashboard";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createServerSupabase();
  
  // Realizamos las consultas de métricas globales de Hocker One
  const { data: snapshotData } = await supabase.rpc("get_dashboard_snapshot");
  
  const { data: recentEvents } = await supabase
    .from("events")
    .select("id, type, message, level, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentCommands } = await supabase
    .from("commands")
    .select("id, command, project_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const snapshotRow = snapshotData?.[0] ?? {};

  const metrics = [
    {
      label: "Proyectos Activos",
      value: String(snapshotRow.known_projects ?? 0),
      hint: `De ${snapshotRow.total_projects ?? 0} totales`,
    },
    {
      label: "Nodos AGI",
      value: String(snapshotRow.live_nodes ?? 0),
      hint: `De ${snapshotRow.total_nodes ?? 0} totales`,
    },
    {
      label: "Eventos (24h)",
      value: String(snapshotRow.events_24h ?? 0),
      hint: "En el ecosistema",
    },
    {
      label: "Comandos en Cola",
      value: String(snapshotRow.queued_commands ?? 0),
      hint: "Pendientes",
    },
    {
      label: "Ingresos Brutos",
      value: `$${((snapshotRow.gross_revenue_cents ?? 0) / 100).toFixed(2)}`,
      hint: "Acumulado global",
    },
  ];

  return {
    snapshotAt: new Date().toISOString(),
    metrics,
    apps: APP_REGISTRY,
    agis: AGI_REGISTRY,
    repos: REPO_REGISTRY,
    services: resolveExternalServices(),
    recentEvents: (recentEvents ?? []).map((e: any) => ({
      id: e.id,
      title: e.type,
      detail: e.message,
      level: e.level === "warn" || e.level === "error" ? e.level : "info",
      at: e.created_at,
    })),
    recentCommands: (recentCommands ?? []).map((c: any) => ({
      id: c.id,
      command: c.command,
      projectId: c.project_id,
      status: c.status,
      createdAt: c.created_at,
    })),
  };
}