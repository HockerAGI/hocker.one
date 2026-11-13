import { createAdminSupabase } from "@/lib/supabase-admin";

const PROJECT_ID = "hocker-one";
const EXPECTED_AGIS = 16;
const MAX_AGENTS = 24;
const MAX_TASKS = 100;
const MAX_MEMORIES = 100;

function required<T>(data: T | null, error: { message: string } | null, code: string): T {
  if (error || data === null) throw new Error(code);
  return data;
}

function isRecent(value: string | null, now: number, minutes: number): boolean {
  if (!value) return false;
  const age = now - Date.parse(value);
  return Number.isFinite(age) && age >= 0 && age < minutes * 60_000;
}

/** Evidence only. Never claim an AGI task, call an LLM, publish memory or approve an action. */
export async function getNovaZeroCreditSnapshot() {
  const sb = createAdminSupabase();
  const observed = new Date();
  const [agentsR, tasksR, memoryR, runsR, usageR, nodesR, ownerR] = await Promise.all([
    sb.from("agi_agents").select("agi_id,allow_actions").eq("project_id", PROJECT_ID).limit(MAX_AGENTS),
    sb.from("agi_tasks").select("id,status,write_policy,created_at")
      .eq("project_id", PROJECT_ID).in("status", ["queued", "pending"]).limit(MAX_TASKS),
    sb.from("agi_memory_mirror").select("active,safety_status,requires_owner_approval,approved_by_nova,approved_by_syntia,approved_by_vertx,approved_by_jurix")
      .eq("project_id", PROJECT_ID).limit(MAX_MEMORIES),
    sb.from("agi_runs").select("created_at").eq("project_id", PROJECT_ID)
      .order("created_at", { ascending: false }).limit(1),
    sb.from("llm_usage").select("created_at").eq("project_id", PROJECT_ID)
      .order("created_at", { ascending: false }).limit(1),
    sb.from("nodes").select("id,last_seen_at").eq("project_id", PROJECT_ID)
      .in("id", ["nova-runtime-1", "hocker-node-1"]).limit(3),
    sb.from("owner_gate_approvals").select("id", { count: "exact", head: true }).eq("project_id", PROJECT_ID),
  ]);

  const agents = required(agentsR.data, agentsR.error, "NOVA_AGENTS_READ_FAILED");
  const tasks = required(tasksR.data, tasksR.error, "NOVA_TASKS_READ_FAILED");
  const memories = required(memoryR.data, memoryR.error, "NOVA_MEMORY_READ_FAILED");
  const runs = required(runsR.data, runsR.error, "NOVA_RUNS_READ_FAILED");
  const usage = required(usageR.data, usageR.error, "NOVA_USAGE_READ_FAILED");
  const nodes = required(nodesR.data, nodesR.error, "NOVA_NODES_READ_FAILED");
  if (ownerR.error) throw new Error("NOVA_OWNER_GATE_READ_FAILED");

  const inventoryComplete = agents.length < MAX_AGENTS &&
    tasks.length < MAX_TASKS && memories.length < MAX_MEMORIES;
  const recentRun = runs[0]?.created_at ?? null;
  const recentInference = usage[0]?.created_at ?? null;
  const nova = nodes.find((row) => row.id === "nova-runtime-1");
  const physical = nodes.find((row) => row.id === "hocker-node-1");
  const now = observed.getTime();
  const novaFresh = isRecent(nova?.last_seen_at ?? null, now, 5);
  const physicalFresh = isRecent(physical?.last_seen_at ?? null, now, 5);
  const guarded = agents.every((agent) => agent.allow_actions === false);
  const mirrorEligible = memories.filter((m) =>
    m.active && m.safety_status === "safe" &&
    (!m.requires_owner_approval ||
      (m.approved_by_nova && m.approved_by_syntia && m.approved_by_vertx && m.approved_by_jurix))
  ).length;
  const legacyTasks = tasks.filter((t) => !isRecent(t.created_at, now, 1440)).length;
  const warnings = [
    ...(agents.length !== EXPECTED_AGIS ? ["AGI_REGISTRY_INCOMPLETE"] : []),
    ...(!guarded ? ["AGI_ACTIONS_ENABLED_REVIEW_REQUIRED"] : []),
    ...(!inventoryComplete ? ["SNAPSHOT_CAPPED_NOT_COMPLETE"] : []),
    ...(legacyTasks > 0 ? ["LEGACY_TASKS_REQUIRE_MANUAL_TRIAGE"] : []),
    ...(!novaFresh ? ["NOVA_RUNTIME_HEARTBEAT_NOT_FRESH"] : []),
    ...(!physicalFresh ? ["PHYSICAL_NODE_HEARTBEAT_NOT_FRESH"] : []),
    ...(!isRecent(recentInference, now, 1440) ? ["RECENT_INFERENCE_NOT_EVIDENCED"] : []),
  ];

  return {
    ok: true,
    project_id: PROJECT_ID,
    observed_at: observed.toISOString(),
    mode: "read_only_zero_credit_observation",
    provider_requests_executed: 0,
    material_actions_executed: 0,
    memories_published: 0,
    inventory_complete: inventoryComplete,
    agis: { registered: agents.length, expected: EXPECTED_AGIS, all_actions_disabled: guarded },
    task_queue: { pending_or_queued: tasks.length, legacy_older_than_24h: legacyTasks, auto_replayed: 0 },
    memory_mirror: { records: memories.length, eligible_for_read_only_reuse: mirrorEligible, published_by_observer: 0 },
    owner_gate: { historical_approvals: ownerR.count ?? null, approved_by_observer: 0 },
    evidence: {
      last_agi_run_at: recentRun,
      last_inference_record_at: recentInference,
      nova_runtime_last_seen_at: nova?.last_seen_at ?? null,
      physical_node_last_seen_at: physical?.last_seen_at ?? null,
      nova_runtime_heartbeat_fresh: novaFresh,
      physical_node_heartbeat_fresh: physicalFresh,
      live_model_inference: "not_tested_by_observer",
      physical_worker_execution: "not_tested_by_observer",
      independent_failover: "not_certified",
    },
    warnings,
    ready_for_unattended_material_execution: false,
  };
}
