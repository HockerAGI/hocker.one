import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type QueueRow = {
  id: string;
  project_id: string;
  agi_id: string | null;
  tool_key: string | null;
  action_type: string;
  title: string;
  status: string;
  risk_level: string | null;
  created_at: string;
  updated_at?: string | null;
  executed_at?: string | null;
  execution_error?: string | null;
};

export type AgiQueueLockState = {
  locked: boolean;
  can_start_new_task: boolean;
  reason: string;
  project_id: string;
  checked_at: string;
  blocking_statuses: string[];
  clear_statuses: string[];
  blocking_count: number;
  total_recent: number;
  status_counts: Record<string, number>;
  active_actions: QueueRow[];
  source: "supabase" | "safe_fallback";
  error?: string;
};

export const AGI_QUEUE_BLOCKING_STATUSES = [
  "needs_approval",
  "approved",
  "queued",
  "dry_run_queued",
  "running",
  "executing",
  "execution_failed",
  "failed",
  "error",
  "needs_fix",
  "review",
] as const;

export const AGI_QUEUE_CLEAR_STATUSES = [
  "executed",
  "completed",
  "rejected",
  "cancelled",
  "canceled",
] as const;

function envValue(key: string): string {
  return String(process.env[key] ?? "").trim();
}

function getAdminSupabase(): SupabaseClient {
  const url = envValue("SUPABASE_URL") || envValue("NEXT_PUBLIC_SUPABASE_URL");
  const key = envValue("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error("Supabase admin no configurado para leer la cola AGI.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function countStatuses(rows: QueueRow[]): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, item) => {
    const status = String(item.status || "unknown");
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
}

export async function getAgiQueueLock(project_id: string, limit = 80): Promise<AgiQueueLockState> {
  const checked_at = new Date().toISOString();
  const safeProjectId = String(project_id || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one").trim();

  try {
    const sb = getAdminSupabase();
    const { data, error } = await sb
      .from("agi_action_queue")
      .select("id,project_id,agi_id,tool_key,action_type,title,status,risk_level,created_at,updated_at,executed_at,execution_error")
      .eq("project_id", safeProjectId)
      .order("created_at", { ascending: false })
      .limit(Math.max(10, Math.min(limit, 120)));

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as QueueRow[];
    const blocking = rows.filter((item) =>
      AGI_QUEUE_BLOCKING_STATUSES.includes(String(item.status) as typeof AGI_QUEUE_BLOCKING_STATUSES[number]),
    );

    const locked = blocking.length > 0;

    return {
      locked,
      can_start_new_task: !locked,
      reason: locked
        ? "Hay una tarea pendiente en cola. NOVA no debe iniciar otra hasta cerrar, cancelar o corregir la actual."
        : "Cola limpia. NOVA puede analizar y preparar trabajo sin mezclar procesos.",
      project_id: safeProjectId,
      checked_at,
      blocking_statuses: [...AGI_QUEUE_BLOCKING_STATUSES],
      clear_statuses: [...AGI_QUEUE_CLEAR_STATUSES],
      blocking_count: blocking.length,
      total_recent: rows.length,
      status_counts: countStatuses(rows),
      active_actions: blocking.slice(0, 8),
      source: "supabase",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer la cola AGI.";

    return {
      locked: true,
      can_start_new_task: false,
      reason: "No pude confirmar que la cola esté limpia. Por seguridad, NOVA no debe iniciar tareas nuevas.",
      project_id: safeProjectId,
      checked_at,
      blocking_statuses: [...AGI_QUEUE_BLOCKING_STATUSES],
      clear_statuses: [...AGI_QUEUE_CLEAR_STATUSES],
      blocking_count: 0,
      total_recent: 0,
      status_counts: {},
      active_actions: [],
      source: "safe_fallback",
      error: message,
    };
  }
}

export function buildNovaProductionGateContext(lock: AgiQueueLockState) {
  return {
    queue_lock: lock,
    production_gate_policy: {
      version: "12.7C-1",
      rule: "No iniciar tareas nuevas si la cola tiene pendientes. No mostrar botones técnicos. Solo pedir autorización final cuando todo esté probado, validado y listo para producción.",
      allowed_final_buttons: ["Ver resumen", "Enviar a producción", "No enviar", "Deshacer"],
      forbidden_micro_buttons: ["Crear rama", "Subir archivo", "Abrir PR", "Selector manual de AGI", "Selector manual de IA", "Ejecutar worker"],
      automatic_model_routing: { enabled: true, strategy: "best_available_then_fallback", user_selects_model: false },
      action_creation_from_chat: false,
      reason: "En 12.7C-1 NOVA Chat queda como centro conversacional y visual. La creación automática de acciones productivas se habilitará después de cerrar Queue Lock + Production Gate.",
    },
    nova_language_policy: {
      tone: "natural, clara, cercana, estratégica y sin sonar robótica",
      explain_technical_terms: true,
      never_fake_integrations: true,
      choose_agi_automatically: true,
      user_should_not_choose_agi: true,
    },
  };
}
