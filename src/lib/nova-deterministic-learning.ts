import { createHash, randomUUID } from "node:crypto";
import { isHockerAgiId } from "@/lib/hocker-agi-canon";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { submitSyntiaMemoryProposal } from "@/lib/syntia-memory-write-gate";
import { classifyKnownWorkerFailure, FAILURE_DEFINITIONS, NOVA_FAILURE_CLASSIFIER_VERSION, selectNewLearningGroups, type FailureCategory } from "@/lib/nova-failure-catalog";

const PROJECT_ID = "hocker-one";
const WINDOW_HOURS = 24;
const MAX_SCANNED = 48;
const MAX_GROUPS_PER_TICK = 4;
const MAX_CREATED_PER_TICK = 2;

type FailedRun = {
  id: string;
  agi_id: string | null;
  task_id: string | null;
  worker_id: string | null;
  error: string | null;
  finished_at: string | null;
};
type Group = { agi_id: string; category: FailureCategory; task_ids: Set<string>; run_ids: string[] };

/**
 * Runs only behind the existing token-protected continuity cron.
 * Uses actual failed worker records; no model inference, user content or task replays.
 * Only creates SYNTIA pending_review proposals via the existing write gate.
 */
export async function processVerifiedFailureLearning() {
  if (process.env.NOVA_DETERMINISTIC_LEARNING_ENABLED === "false") {
    return { enabled: false, analyzed: 0, proposed: 0, deduplicated: 0, published: 0, actions: 0 };
  }
  const now = Date.now();
  const since = new Date(now - WINDOW_HOURS * 3_600_000).toISOString();
  const { data, error } = await createAdminSupabase()
    .from("agi_runs")
    .select("id,agi_id,task_id,worker_id,error,finished_at")
    .eq("project_id", PROJECT_ID)
    .eq("status", "failed")
    .gte("finished_at", since)
    .order("finished_at", { ascending: false })
    .limit(MAX_SCANNED + 1);

  if (error || !data) throw new Error("NOVA_FAILURE_EVIDENCE_READ_FAILED");
  if (data.length > MAX_SCANNED) {
    // A capped sample cannot be treated as representative evidence.
    return { enabled: true, analyzed: 0, proposed: 0, deduplicated: 0,
      published: 0, actions: 0, reason: "FAILURE_SAMPLE_OVER_LIMIT" };
  }

  const groups = new Map<string, Group>();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const item of data as FailedRun[]) {
    if (!item.agi_id || !isHockerAgiId(item.agi_id)) continue;
    if (!item.worker_id ||
      !(item.worker_id.startsWith("hocker-one-unified:") ||
        item.worker_id.startsWith("hocker-one-serverless:"))) continue;
    if (!item.task_id || !uuid.test(item.task_id) || !uuid.test(item.id)) continue;
    const at = Date.parse(String(item.finished_at ?? ""));
    if (!Number.isFinite(at) || at > now || at < now - WINDOW_HOURS * 3_600_000) continue;
    const category = classifyKnownWorkerFailure(item.error);
    if (!category) continue;
    const key = item.agi_id + ":" + category;
    const group = groups.get(key) ?? {
      agi_id: item.agi_id, category, task_ids: new Set<string>(), run_ids: [],
    };
    group.task_ids.add(item.task_id);
    if (!group.run_ids.includes(item.id)) group.run_ids.push(item.id);
    groups.set(key, group);
  }

  // Independent task IDs reduce noise from repeated attempts of one task.
  const recurring = [...groups.values()].filter((g) => g.task_ids.size >= 2)
    .sort((a, b) => b.task_ids.size - a.task_ids.size ||
      a.agi_id.localeCompare(b.agi_id) || a.category.localeCompare(b.category));
  const annotated = recurring.map((group) => ({
    group,
    source_hash: createHash("sha256")
      .update([PROJECT_ID, group.agi_id, group.category, NOVA_FAILURE_CLASSIFIER_VERSION].join("|"))
      .digest("hex"),
  }));

  // Read BOTH live proposals and active mirror entries before prioritizing work.
  // A previously reviewed class must not starve a different new class.
  const existingHashes = new Set<string>();
  if (annotated.length) {
    const hashes = annotated.map((item) => item.source_hash);
    const sb = createAdminSupabase();
    const [proposalsR, mirrorR] = await Promise.all([
      sb.from("agi_learning_events").select("source_hash").eq("project_id", PROJECT_ID)
        .in("status", ["pending_review", "approved"]).in("source_hash", hashes)
        .limit(MAX_SCANNED),
      sb.from("agi_memory_mirror").select("source_hash").eq("project_id", PROJECT_ID)
        .eq("active", true).in("source_hash", hashes).limit(MAX_SCANNED),
    ]);
    if (proposalsR.error || mirrorR.error || !proposalsR.data || !mirrorR.data) {
      throw new Error("NOVA_LEARNING_DEDUPLICATION_READ_FAILED");
    }
    for (const row of [...proposalsR.data, ...mirrorR.data]) {
      if (typeof row.source_hash === "string") existingHashes.add(row.source_hash);
    }
  }

  const fresh = selectNewLearningGroups(annotated, existingHashes, MAX_GROUPS_PER_TICK);
  const eligibleCount = annotated.length - annotated.filter((g) => existingHashes.has(g.source_hash)).length;
  let proposed = 0;
  let deduplicated = annotated.length - eligibleCount;
  let blocked = 0;
  let inspectedGroups = 0;

  for (const item of fresh) {
    if (proposed >= MAX_CREATED_PER_TICK) break;
    inspectedGroups += 1;
    const group = item.group;
    const rule = FAILURE_DEFINITIONS[group.category];
    const sourceHash = item.source_hash;

    // Evidence is only UUID references and counts. Never persist the raw error,
    // user prompts, task input/output, tokens or untrusted instructions.
    const input = {
      project_id: PROJECT_ID,
      source_agi_id: group.agi_id,
      learning_title: "Patrón verificado para revisión: " + rule.label,
      learning_summary: "Se registraron " + group.task_ids.size +
        " tareas diferentes con fallos categorizados de " + group.agi_id +
        " en una ventana de 24 horas. " + rule.meaning +
        " Hipótesis pendiente de validación humana; no constituye una nueva política.",
      learning_category: "error_resolution",
      update_type: "error_prevention",
      source_type: "internal_metric",
      source_name: "nova-deterministic-failure-triage",
      source_hash: sourceHash,
      risk_level: rule.risk,
      confidence_score: 2,
      freshness_score: 5,
      suggested_targets: [group.agi_id],
      applies_to_agi_ids: [group.agi_id],
      evidence: {
        classifier_version: NOVA_FAILURE_CLASSIFIER_VERSION,
        source_table: "public.agi_runs",
        event_type: "failed",
        category: group.category,
        unique_task_count: group.task_ids.size,
        source_refs: group.run_ids.slice(0, 6).map((id) => "run:" + id),
        window_hours: WINDOW_HOURS,
      },
      recommended_action: rule.action,
      requires_owner_approval: true,
      submitted_by: "nova-deterministic-failure-triage",
      retention_tier: "warm",
      action_scope: "recommendation",
    };
    const result = await submitSyntiaMemoryProposal(input, randomUUID());
    if (result.ok === true && result.status === "pending_review" && !("deduplicated" in result && result.deduplicated)) {
      proposed += 1;
    } else if (("deduplicated" in result && result.deduplicated) ||
      ("preflight" in result && result.preflight?.decision?.duplicate_block === true)) {
      deduplicated += 1;
    } else {
      blocked += 1;
    }
  }

  return {
    enabled: true,
    mode: "verified_failure_to_pending_review_only",
    classifier_version: NOVA_FAILURE_CLASSIFIER_VERSION,
    analyzed: data.length,
    recurring_categories: recurring.length,
    inspected_groups: inspectedGroups,
    deferred_categories: Math.max(0, eligibleCount - inspectedGroups),
    proposed,
    deduplicated,
    blocked,
    published: 0,
    actions: 0,
    inference_calls: 0,
    replayed_legacy_tasks: 0,
    owner_gate_bypassed: false,
  };
}
