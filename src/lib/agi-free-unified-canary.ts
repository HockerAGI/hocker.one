import "server-only";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { assertAgiBacklogReviewed } from "@/lib/agi-stale-backlog-gate";
import { cloudflareFreePilotConfigured } from "@/lib/cloudflare-zero-credit-policy";

export const FREE_UNIFIED_HOSTIA_KEY = "free-unified-hostia-v1:one-time";
const PROJECT = "hocker-one";

export function freeUnifiedHostiaConfigured(): boolean {
  return process.env.AGI_FREE_UNIFIED_WORKER_CANARY_ENABLED === "true" &&
    cloudflareFreePilotConfigured();
}

export async function reserveOneFreeUnifiedHostiaTask(params: {
  project_id: string;
  requested_by: string | null | undefined;
  worker_id: string;
}) {
  if (params.project_id !== PROJECT || !params.requested_by ||
      !/^hocker-one-unified:[a-z0-9-]+:[a-f0-9-]{36}$/i.test(params.worker_id)) {
    throw new Error("FREE_UNIFIED_OWNER_OR_WORKER_SCOPE_INVALID");
  }
  if (!freeUnifiedHostiaConfigured()) {
    throw new Error("FREE_UNIFIED_ROUTE_NOT_CONFIGURED");
  }
  await assertAgiBacklogReviewed(PROJECT);
  const admin = createAdminSupabase();
  // All checks are read-only; any missing or unverifiable read blocks the insert.
  const [owner, agents, tasks, actions, previous] = await Promise.all([
    admin.from("project_members").select("user_id")
      .eq("project_id", PROJECT).eq("role", "owner")
      .eq("user_id", params.requested_by).maybeSingle(),
    admin.from("agi_agents").select("agi_id,allow_actions")
      .eq("project_id", PROJECT),
    admin.from("agi_tasks").select("id", { head: true, count: "exact" })
      .eq("project_id", PROJECT).in("status", ["queued", "pending", "working"]),
    admin.from("agi_action_queue").select("id", { head: true, count: "exact" })
      .eq("project_id", PROJECT).in("status", ["draft", "pending_review", "approved", "executing"]),
    admin.from("agi_tasks").select("id")
      .eq("project_id", PROJECT).eq("idempotency_key", FREE_UNIFIED_HOSTIA_KEY)
      .maybeSingle(),
  ]);
  if (owner.error || agents.error || tasks.error || actions.error || previous.error ||
      !Array.isArray(agents.data) || typeof tasks.count !== "number" ||
      typeof actions.count !== "number") {
    throw new Error("FREE_UNIFIED_PREFLIGHT_UNAVAILABLE");
  }
  if (!owner.data) throw new Error("FREE_UNIFIED_OWNER_REQUIRED");
  if (previous.data) throw new Error("FREE_UNIFIED_ALREADY_STARTED");
  if (agents.data.length !== 16 || agents.data.some((agent) => agent.allow_actions !== false) ||
      !agents.data.some((agent) => agent.agi_id === "hostia")) {
    throw new Error("FREE_UNIFIED_AGENT_GUARD_BLOCKED");
  }
  if (tasks.count !== 0 || actions.count !== 0) {
    throw new Error("FREE_UNIFIED_QUEUE_NOT_EMPTY");
  }

  // One INSERT is the exact task claim: its ID, worker lock and one-attempt
  // key are assigned together. The existing UNIQUE (project_id,idempotency_key)
  // protects concurrent Owner requests, without claiming unrelated queued work.
  const now = new Date().toISOString();
  const snapshot = {
    source: "supabase_live_readonly",
    observed_at: now,
    project_id: PROJECT,
    registered_agis: agents.data.length,
    allow_actions_true: 0,
    queued_or_pending_or_working: tasks.count,
    pending_material_actions: actions.count,
    specialist: "hostia",
    scope: "one_scoped_unified_worker_readonly_proof_not_delegation",
  };
  const { data, error } = await admin.from("agi_tasks").insert({
    project_id: PROJECT, agi_id: "hostia", assigned_to: "hostia",
    title: "HOSTIA · primera prueba acotada del worker unificado (Free)",
    details: "Evaluar únicamente los conteos auténticos adjuntos, sin acceso a infraestructura ni herramientas.",
    priority: "normal", task_type: "analysis", status: "working",
    input: { snapshot, free_only: true, no_tools: true },
    payload: {
      source: "hocker-one-unified-free-v1", free_only: true,
      no_external_actions: true, no_delegation: true,
    },
    output: {}, evidence: [], created_by: params.requested_by,
    requires_approval: false, write_policy: "draft_only",
    attempt_count: 1, max_attempts: 1, idempotency_key: FREE_UNIFIED_HOSTIA_KEY,
    locked_at: now, lock_owner: params.worker_id,
    started_at: now, last_heartbeat_at: now,
  }).select("id,project_id,agi_id,assigned_to,title,details,priority,payload,input,write_policy,attempt_count").single();
  if (error || !data) {
    throw new Error(error?.code === "23505"
      ? "FREE_UNIFIED_ALREADY_STARTED" : "FREE_UNIFIED_EXACT_RESERVATION_FAILED");
  }
  return data;
}
