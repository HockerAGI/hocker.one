import { createAdminSupabase } from "@/lib/supabase-admin";

export type HockerNodeRuntimeState = "activo" | "sin_senal_reciente" | "pendiente";

export type HockerNodeRuntimeSummary = {
  node_id: string;
  title: string;
  role_label: "Principal" | "Espejo";
  state: HockerNodeRuntimeState;
  state_label: string;
  last_seen_at: string | null;
  last_task_label: string;
  last_task_status: string | null;
  safe_mode_enabled: boolean | null;
  writes_allowed: boolean | null;
  kill_switch_enabled: boolean | null;
};

export type HockerNodeMirrorSummary = {
  ok: true;
  generated_at: string;
  primary: HockerNodeRuntimeSummary;
  mirror: HockerNodeRuntimeSummary;
  failover: {
    state: "bloqueado" | "listo_para_revision";
    label: string;
    reason: string;
  };
  executive_summary: string[];
};

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function newestDate(...values: Array<string | null | undefined>): string | null {
  const valid = values
    .filter(Boolean)
    .map((value) => String(value))
    .filter((value) => !Number.isNaN(new Date(value).getTime()))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return valid[0] ?? null;
}

function isRecent(value: string | null, minutes = 20): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= minutes * 60 * 1000;
}

function taskLabel(command: string | null) {
  if (command === "status") return "Revisión de estado";
  if (command === "ping") return "Prueba de conexión";
  if (!command) return "Sin tarea reciente";
  return command;
}

async function getNodeRuntime(
  nodeId: string,
  title: string,
  roleLabel: "Principal" | "Espejo",
): Promise<HockerNodeRuntimeSummary> {
  const sb = createAdminSupabase();

  const { data: latestCommand } = await sb
    .from("commands")
    .select("id,project_id,node_id,command,status,result,error,created_at,started_at,finished_at,executed_at,completed_at")
    .eq("project_id", "hocker-one")
    .eq("node_id", nodeId)
    .in("command", ["ping", "status"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latestStatusCommand } = await sb
    .from("commands")
    .select("id,project_id,node_id,command,status,result,error,created_at,started_at,finished_at,executed_at,completed_at")
    .eq("project_id", "hocker-one")
    .eq("node_id", nodeId)
    .eq("command", "status")
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latestEvent } = await sb
    .from("events")
    .select("id,project_id,node_id,level,type,message,created_at")
    .eq("project_id", "hocker-one")
    .eq("node_id", nodeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastSeenAt = newestDate(
    asString(latestCommand?.finished_at),
    asString(latestCommand?.executed_at),
    asString(latestCommand?.completed_at),
    asString(latestEvent?.created_at),
  );

  const result = asRecord(latestStatusCommand?.result ?? latestCommand?.result);
  const sandbox = asRecord(result.sandbox);
  const controls = asRecord(result.controls);

  const state: HockerNodeRuntimeState = isRecent(lastSeenAt)
    ? "activo"
    : lastSeenAt
      ? "sin_senal_reciente"
      : "pendiente";

  return {
    node_id: nodeId,
    title,
    role_label: roleLabel,
    state,
    state_label:
      state === "activo"
        ? "Activo"
        : state === "sin_senal_reciente"
          ? "Sin señal reciente"
          : "Pendiente de conexión",
    last_seen_at: lastSeenAt,
    last_task_label: taskLabel(asString(latestCommand?.command)),
    last_task_status: asString(latestCommand?.status),
    safe_mode_enabled: asBoolean(sandbox.enabled),
    writes_allowed: asBoolean(controls.allow_write),
    kill_switch_enabled: asBoolean(controls.kill_switch),
  };
}

export async function getHockerNodeMirrorSummary(): Promise<HockerNodeMirrorSummary> {
  const primaryNodeId =
    process.env.HOCKER_PRIMARY_AGENT_NODE_ID ||
    process.env.HOCKER_PHYSICAL_AGENT_NODE_ID ||
    process.env.HOCKER_LOCAL_AGENT_NODE_ID ||
    "hocker-node-1";

  const mirrorNodeId =
    process.env.HOCKER_MIRROR_AGENT_NODE_ID ||
    "hocker-node-mirror-1";

  const [primary, mirror] = await Promise.all([
    getNodeRuntime(primaryNodeId, "Nodo principal", "Principal"),
    getNodeRuntime(mirrorNodeId, "Nodo espejo", "Espejo"),
  ]);

  const mirrorActive = mirror.state === "activo";
  const primaryActive = primary.state === "activo";

  const failover =
    mirrorActive && !primaryActive
      ? {
          state: "listo_para_revision" as const,
          label: "Listo para revisión",
          reason: "El espejo respondió y el principal no está reciente. Requiere aprobación del owner antes de operar.",
        }
      : {
          state: "bloqueado" as const,
          label: "Bloqueado",
          reason: mirrorActive
            ? "El espejo existe, pero el cambio de control debe aprobarse manualmente."
            : "El espejo todavía no tiene señal real. No se permite failover.",
        };

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    primary,
    mirror,
    failover,
    executive_summary: [
      primary.state === "activo"
        ? "El nodo principal respondió recientemente."
        : "El nodo principal no tiene señal reciente.",
      mirror.state === "activo"
        ? "El nodo espejo respondió recientemente."
        : "El nodo espejo sigue pendiente de conexión real.",
      failover.state === "bloqueado"
        ? "El failover permanece bloqueado para evitar operación falsa o insegura."
        : "El failover está listo para revisión, pero requiere aprobación del owner.",
    ],
  };
}
