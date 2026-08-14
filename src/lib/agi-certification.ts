import { AGI_EVAL_SUITE_VERSION, getAgiEvalSuite } from "@/lib/agi-eval-suites";
import { HOCKER_AGI_CANON } from "@/lib/hocker-agi-canon";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const AGI_CERTIFICATION_VERSION = "2026.08.14-4";

type AgentRow = {
  agi_id: string;
  name: string | null;
  status: string | null;
  autonomy_level: string | null;
  allow_actions: boolean | null;
};
type ToolRow = { agi_id: string; enabled: boolean | null };
type MemoryRow = { agi_id: string | null; target_agi_ids: string[] | null; active: boolean | null };
type OperationalRow = { agi_id: string; tasks: number | null; runs: number | null };
type EvalFeedbackRow = {
  agi_id: string | null;
  feedback_type: string;
  payload: unknown;
  created_at: string;
};
type EvalRunRow = {
  id: string;
  project_id: string;
  agi_id: string | null;
  status: string;
  input: unknown;
  finished_at: string | null;
  result_hash: string | null;
};

export type AgiCertificationCheck =
  | "canonical_profile"
  | "tools_ready"
  | "memory_ready"
  | "runtime_evidence"
  | "allow_actions_guarded"
  | "eval_contract_suite"
  | "individual_eval_suite";

export type AgiCertificationEntry = {
  agi_id: string;
  name: string;
  status: string;
  autonomy: string;
  evidence_percent: number;
  passed: number;
  total: number;
  certified_for_current_scope: boolean;
  checks: Record<AgiCertificationCheck, boolean>;
  missing: AgiCertificationCheck[];
};

export type AgiCertificationSnapshot = {
  version: string;
  checked_at: string;
  source: "supabase+code" | "partial";
  eval_suite_version: string;
  certified: number;
  pending: number;
  entries: AgiCertificationEntry[];
};

function canonicalId(value: string): string {
  return value.trim().toLowerCase().replaceAll("-", "_");
}

function countByAgi(rows: ToolRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.enabled) continue;
    const id = canonicalId(row.agi_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasVerifiedRuntimeEval(
  feedbackRows: EvalFeedbackRow[],
  runRows: EvalRunRow[],
  agiId: string,
  projectId: string,
): boolean {
  const suite = getAgiEvalSuite(agiId);
  if (!suite) return false;

  const latest = feedbackRows.find((row) => canonicalId(String(row.agi_id ?? "")) === agiId);
  const payload = asRecord(latest?.payload);
  if (!payload) return false;

  const evidenceRunIds = Array.isArray(payload.evidence_run_ids)
    ? payload.evidence_run_ids.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];
  const evidenceRunIdSet = new Set(evidenceRunIds);

  if (
    latest?.feedback_type !== "agi_eval_result"
    || payload.suite_version !== AGI_EVAL_SUITE_VERSION
    || payload.passed !== true
    || Number(payload.cases_total) !== suite.cases.length
    || Number(payload.cases_passed) !== suite.cases.length
    || evidenceRunIds.length !== suite.cases.length
    || evidenceRunIdSet.size !== suite.cases.length
  ) {
    return false;
  }

  return suite.cases.every((evalCase) => {
    const run = runRows.find((candidate) => {
      if (!evidenceRunIdSet.has(candidate.id)) return false;
      const input = asRecord(candidate.input);
      return input?.eval_case_id === evalCase.id;
    });
    if (!run) return false;
    if (run.status !== "completed") return false;
    if (run.project_id !== projectId) return false;
    if (canonicalId(String(run.agi_id ?? "")) !== agiId) return false;
    if (!run.finished_at || !run.result_hash) return false;

    const input = asRecord(run.input);
    return input?.eval_suite_version === AGI_EVAL_SUITE_VERSION
      && input?.eval_case_id === evalCase.id;
  });
}

export async function getAgiCertificationSnapshot(projectId = "hocker-one"): Promise<AgiCertificationSnapshot> {
  const checkedAt = new Date().toISOString();

  try {
    const sb = createAdminSupabase();
    const [agentsRes, toolsRes, memoryRes, operationsRes, evalFeedbackRes, evalRunsRes] = await Promise.all([
      sb.from("agi_agents").select("agi_id,name,status,autonomy_level,allow_actions").eq("project_id", projectId),
      sb.from("agi_agent_tools").select("agi_id,enabled").eq("project_id", projectId),
      sb.from("agi_memory_mirror").select("agi_id,target_agi_ids,active").eq("project_id", projectId).eq("active", true),
      sb.from("v_agi_operational_state").select("agi_id,tasks,runs"),
      sb.from("agi_feedback")
        .select("agi_id,feedback_type,payload,created_at")
        .eq("project_id", projectId)
        .eq("feedback_type", "agi_eval_result")
        .order("created_at", { ascending: false })
        .limit(500),
      sb.from("agi_runs")
        .select("id,project_id,agi_id,status,input,finished_at,result_hash")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const queryFailed = [agentsRes, toolsRes, memoryRes, operationsRes, evalFeedbackRes, evalRunsRes]
      .some((result) => result.error);
    const agents = (agentsRes.data ?? []) as AgentRow[];
    const toolCounts = countByAgi((toolsRes.data ?? []) as ToolRow[]);
    const memories = (memoryRes.data ?? []) as MemoryRow[];
    const evalFeedback = (evalFeedbackRes.data ?? []) as EvalFeedbackRow[];
    const evalRuns = (evalRunsRes.data ?? []) as EvalRunRow[];
    const operations = new Map(
      ((operationsRes.data ?? []) as OperationalRow[]).map((row) => [canonicalId(row.agi_id), row]),
    );
    const agentsById = new Map(agents.map((row) => [canonicalId(row.agi_id), row]));

    const entries: AgiCertificationEntry[] = HOCKER_AGI_CANON.map((profile) => {
      const id = canonicalId(profile.id);
      const agent = agentsById.get(id);
      const operational = operations.get(id);
      const memoryReady = memories.some((row) => {
        const direct = row.agi_id ? canonicalId(row.agi_id) === id : false;
        const targeted = (row.target_agi_ids ?? []).some((target) => canonicalId(target) === id);
        return Boolean(row.active && (direct || targeted));
      });
      const isShadows = id === "shadows";
      const evalSuite = getAgiEvalSuite(id);

      const checks: Record<AgiCertificationCheck, boolean> = {
        canonical_profile: Boolean(agent),
        tools_ready: isShadows ? toolCounts.get(id) === undefined : (toolCounts.get(id) ?? 0) > 0,
        memory_ready: memoryReady,
        runtime_evidence: (Number(operational?.tasks ?? 0) > 0) && (Number(operational?.runs ?? 0) > 0),
        allow_actions_guarded: agent?.allow_actions === false,
        eval_contract_suite: Boolean(evalSuite && evalSuite.version === AGI_EVAL_SUITE_VERSION && evalSuite.cases.length >= 3),
        individual_eval_suite: hasVerifiedRuntimeEval(evalFeedback, evalRuns, id, projectId),
      };

      const missing = (Object.entries(checks) as Array<[AgiCertificationCheck, boolean]>)
        .filter(([, passed]) => !passed)
        .map(([key]) => key);
      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;

      return {
        agi_id: id,
        name: agent?.name ?? profile.name,
        status: agent?.status ?? "missing",
        autonomy: agent?.autonomy_level ?? "unknown",
        evidence_percent: Math.round((passed / total) * 100),
        passed,
        total,
        certified_for_current_scope: !queryFailed && missing.length === 0,
        checks,
        missing,
      };
    });

    return {
      version: AGI_CERTIFICATION_VERSION,
      checked_at: checkedAt,
      source: queryFailed ? "partial" : "supabase+code",
      eval_suite_version: AGI_EVAL_SUITE_VERSION,
      certified: entries.filter((entry) => entry.certified_for_current_scope).length,
      pending: entries.filter((entry) => !entry.certified_for_current_scope).length,
      entries,
    };
  } catch {
    const entries: AgiCertificationEntry[] = HOCKER_AGI_CANON.map((profile) => ({
      agi_id: canonicalId(profile.id),
      name: profile.name,
      status: "unknown",
      autonomy: "unknown",
      evidence_percent: 0,
      passed: 0,
      total: 7,
      certified_for_current_scope: false,
      checks: {
        canonical_profile: false,
        tools_ready: false,
        memory_ready: false,
        runtime_evidence: false,
        allow_actions_guarded: false,
        eval_contract_suite: false,
        individual_eval_suite: false,
      },
      missing: [
        "canonical_profile",
        "tools_ready",
        "memory_ready",
        "runtime_evidence",
        "allow_actions_guarded",
        "eval_contract_suite",
        "individual_eval_suite",
      ],
    }));

    return {
      version: AGI_CERTIFICATION_VERSION,
      checked_at: checkedAt,
      source: "partial",
      eval_suite_version: AGI_EVAL_SUITE_VERSION,
      certified: 0,
      pending: entries.length,
      entries,
    };
  }
}
