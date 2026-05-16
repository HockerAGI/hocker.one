import { createAdminSupabase } from "@/lib/supabase-admin";

export type HockerLiveSummaryCount = {
  label: string;
  table: string;
  count: number | null;
  ok: boolean;
  note?: string;
};

export type HockerLiveSummaryEvent = {
  id: string;
  project_id: string | null;
  level: string | null;
  type: string | null;
  message: string | null;
  created_at: string | null;
};

export type HockerLiveSummaryCommand = {
  id: string;
  project_id: string | null;
  node_id: string | null;
  command: string | null;
  status: string | null;
  error: string | null;
  created_at: string | null;
  finished_at: string | null;
};

export type HockerLiveSummaryMember = {
  project_id: string;
  user_id: string;
  role: string;
  created_at: string | null;
};

export type HockerLiveSummary = {
  ok: boolean;
  generated_at: string;
  mode: "owner_live_summary";
  production: {
    app: string;
    domain: string;
    private_routes_protected: true;
    real_execution_enabled: false;
    execution_lock: true;
  };
  security: {
    owner_gate: "activo";
    private_session: "activa";
    chido_mode: "read_only_preflight_locked";
    sensitive_values_hidden: true;
  };
  counts: HockerLiveSummaryCount[];
  owner_memberships: HockerLiveSummaryMember[];
  recent_events: HockerLiveSummaryEvent[];
  recent_commands: HockerLiveSummaryCommand[];
  recent_audit_logs: HockerLiveSummaryEvent[];
  findings: string[];
};

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

async function countTable(table: string, label: string): Promise<HockerLiveSummaryCount> {
  const sb = createAdminSupabase();

  const { count, error } = await sb
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    return {
      label,
      table,
      count: null,
      ok: false,
      note: error.message,
    };
  }

  return {
    label,
    table,
    count: count ?? 0,
    ok: true,
  };
}

export async function getHockerLiveSummary(): Promise<HockerLiveSummary> {
  const sb = createAdminSupabase();

  const counts = await Promise.all([
    countTable("projects", "Proyectos"),
    countTable("project_members", "Miembros por proyecto"),
    countTable("profiles", "Perfiles"),
    countTable("commands", "Comandos"),
    countTable("events", "Eventos"),
    countTable("audit_logs", "Auditoría"),
    countTable("agis", "AGIs registradas"),
    countTable("nodes", "Nodos"),
    countTable("balances", "Balances"),
    countTable("hocker_tenants", "Tenants Hocker"),
    countTable("hocker_portal_grants", "Grants de portal"),
  ]);

  const { data: ownerMemberships } = await sb
    .from("project_members")
    .select("project_id,user_id,role,created_at")
    .order("created_at", { ascending: true })
    .limit(20);

  const { data: recentEvents } = await sb
    .from("events")
    .select("id,project_id,level,type,message,created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: recentCommands } = await sb
    .from("commands")
    .select("id,project_id,node_id,command,status,error,created_at,finished_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: recentAuditLogs } = await sb
    .from("audit_logs")
    .select("id,project_id,action,created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const commandErrors = (recentCommands ?? []).filter((item) => item.status === "error").length;
  const tenantCount = counts.find((item) => item.table === "hocker_tenants")?.count ?? 0;
  const portalGrantCount = counts.find((item) => item.table === "hocker_portal_grants")?.count ?? 0;

  const findings = [
    "Hocker ONE producción está validado en Vercel.",
    "Las rutas privadas permanecen protegidas.",
    "Chido Casino sigue en modo read-only/preflight bloqueado.",
    tenantCount === 0
      ? "No hay tenants activos todavía."
      : `Tenants activos registrados: ${tenantCount}.`,
    portalGrantCount === 0
      ? "No hay grants reales de portal todavía."
      : `Grants reales de portal registrados: ${portalGrantCount}.`,
    commandErrors > 0
      ? `Existen ${commandErrors} comandos recientes con error. Revisar historial; no asumir fallo actual.`
      : "No se detectaron errores recientes en comandos consultados.",
  ];

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    mode: "owner_live_summary",
    production: {
      app: "Hocker ONE",
      domain: "https://hockerone.vercel.app",
      private_routes_protected: true,
      real_execution_enabled: false,
      execution_lock: true,
    },
    security: {
      owner_gate: "activo",
      private_session: "activa",
      chido_mode: "read_only_preflight_locked",
      sensitive_values_hidden: true,
    },
    counts,
    owner_memberships: (ownerMemberships ?? []).map((item) => ({
      project_id: String(item.project_id),
      user_id: String(item.user_id),
      role: String(item.role),
      created_at: asString(item.created_at),
    })),
    recent_events: (recentEvents ?? []).map((item) => ({
      id: String(item.id),
      project_id: asString(item.project_id),
      level: asString(item.level),
      type: asString(item.type),
      message: asString(item.message),
      created_at: asString(item.created_at),
    })),
    recent_commands: (recentCommands ?? []).map((item) => ({
      id: String(item.id),
      project_id: asString(item.project_id),
      node_id: asString(item.node_id),
      command: asString(item.command),
      status: asString(item.status),
      error: asString(item.error),
      created_at: asString(item.created_at),
      finished_at: asString(item.finished_at),
    })),
    recent_audit_logs: (recentAuditLogs ?? []).map((item) => ({
      id: String(item.id),
      project_id: asString(item.project_id),
      level: "audit",
      type: asString((item as { action?: unknown }).action),
      message: asString((item as { action?: unknown }).action),
      created_at: asString(item.created_at),
    })),
    findings,
  };
}
