import { AGI_EVAL_SUITE_VERSION, getAgiEvalSuite } from "@/lib/agi-eval-suites";
import { HOCKER_AGI_CANON } from "@/lib/hocker-agi-canon";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const AGI_CERTIFICATION_VERSION = "2026.08.19-1";
export const AGI_TOOL_EVAL_VERSION = "2026.08.14-1";
const AGI_EVAL_SCORING_VERSION = "score-v5";

type AgentRow = {
  agi_id: string;
  name: string | null;
  status: string | null;
  autonomy_level: string | null;
  allow_actions: boolean | null;
};
type ToolRow = {
  agi_id: string;
  tool_key: string;
  enabled: boolean | null;
  permission_level: string | null;
  policy: unknown;
};
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
  output: unknown;
  finished_at: string | null;
  result_hash: string | null;
};

export type AgiToolEvalTarget = {
  agi_id: string;
  tool_key: "supabase" | "github";
};

export type AgiCertificationCheck =
  | "canonical_profile"
  | "tools_ready"
  | "tool_runtime_evidence"
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
  tool_eval_version: string;
  certified: number;
  pending: number;
  entries: AgiCertificationEntry[];
  runtime_eval_targets: string[];
  tool_eval_targets: AgiToolEvalTarget[];
};

function canonicalId(value: string): string {
  return value.trim().toLowerCase().replaceAll("-", "_");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function enabledAssignmentsByAgi(rows: ToolRow[]): Map<string, ToolRow[]> {
  const assignments = new Map<string, ToolRow[]>();
  for (const assignment of rows) {
    if (assignment.enabled === true) {
      const id = canonicalId(assignment.agi_id);
      const current = assignments.get(id) ?? [];
      current.push(assignment);
      assignments.set(id, current);
    }
  }
  return assignments;
}

function isAssignmentExecutorReady(assignment: ToolRow): boolean {
  const policy = asRecord(assignment.policy);
  if (!policy) return false;
  const normalized_status = String(policy.normalized_status ?? "");
  const implementation_status = String(policy.implementation_status ?? "");
  const execution_enabled = policy.execution_enabled === true;
  return assignment.enabled === true
    && normalized_status === "connected"
    && implementation_status === "executor_ready"
    && execution_enabled;
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
    || payload.scoring_version !== AGI_EVAL_SCORING_VERSION
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
    const output = asRecord(run.output);
    if (!input || !output) return false;
    return input.eval_suite_version === AGI_EVAL_SUITE_VERSION
      && input.eval_scoring_version === AGI_EVAL_SCORING_VERSION
      && input.eval_case_id === evalCase.id
      && output.eval_suite_version === AGI_EVAL_SUITE_VERSION
      && output.eval_scoring_version === AGI_EVAL_SCORING_VERSION
      && output.eval_case_id === evalCase.id
      && output.passed === true
      && output.external_writes_executed === false;
  });
}

function hasVerifiedToolAssignmentEvidence(
  assignment: ToolRow,
  feedbackRows: EvalFeedbackRow[],
  agiId: string,
): boolean {
  const latest = feedbackRows.find((row) => {
    if (canonicalId(String(row.agi_id ?? "")) !== agiId) return false;
    const payload = asRecord(row.payload);
    return row.feedback_type === "agi_tool_eval_result"
      && payload?.tool_key === assignment.tool_key;
  });
  const payload = asRecord(latest?.payload);
  if (!payload) return false;

  return latest?.feedback_type === "agi_tool_eval_result"
    && payload.tool_eval_version === AGI_TOOL_EVAL_VERSION
    && payload.tool_key === assignment.tool_key
    && payload.passed === true
    && payload.mode === "read_only"
    && payload.external_writes_executed === false
    && typeof payload.evidence_ref === "string"
    && payload.evidence_ref.trim().length > 0;
}

function hasVerifiedToolRuntimeEvidence(
  assignments: ToolRow[],
  feedbackRows: EvalFeedbackRow[],
  agiId: string,
  individualEvalReady: boolean,
): boolean {
  if (assignments.length === 0) return agiId === "shadows";

  return assignments.every((assignment) => {
    if (assignment.tool_key === "ai_gateway") return individualEvalReady;
    return hasVerifiedToolAssignmentEvidence(assignment, feedbackRows, agiId);
  });
}

export async function getAgiCertificationSnapshot(projectId = "hocker-one"): Promise<AgiCertificationSnapshot> {
  const checkedAt = new Date().toISOString();

  try {
    const sb = createAdminSupabase();
    const [agentsRes, toolsRes, memoryRes, operationsRes, evalFeedbackRes, toolFeedbackRes, evalRunsRes] = await Promise.all([
      sb.from("agi_agents").select("agi_id,name,status,autonomy_level,allow_actions").eq("project_id", projectId),
      sb.from("agi_agent_tools").select("agi_id,tool_key,enabled,permission_level,policy").eq("project_id", projectId),
      sb.from("agi_memory_mirror").select("agi_id,target_agi_ids,active").eq("project_id", projectId).eq("active", true),
      sb.from("v_agi_operational_state").select("agi_id,tasks,runs"),
      sb.from("agi_feedback")
        .select("agi_id,feedback_type,payload,created_at")
        .eq("project_id", projectId)
        .eq("feedback_type", "agi_eval_result")
        .order("created_at", { ascending: false })
        .limit(500),
      sb.from("agi_feedback")
        .select("agi_id,feedback_type,payload,created_at")
        .eq("project_id", projectId)
        .eq("feedback_type", "agi_tool_eval_result")
        .order("created_at", { ascending: false })
        .limit(1000),
      sb.from("agi_runs")
        .select("id,project_id,agi_id,status,input,output,finished_at,result_hash")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const queryFailed = [agentsRes, toolsRes, memoryRes, operationsRes, evalFeedbackRes, toolFeedbackRes, evalRunsRes]
      .some((result) => result.error);
    const agents = (agentsRes.data ?? []) as AgentRow[];
    const assignmentsByAgi = enabledAssignmentsByAgi((toolsRes.data ?? []) as ToolRow[]);
    const memories = (memoryRes.data ?? []) as MemoryRow[];
    const evalFeedback = (evalFeedbackRes.data ?? []) as EvalFeedbackRow[];
    const toolFeedback = (toolFeedbackRes.data ?? []) as EvalFeedbackRow[];
    const evalRuns = (evalRunsRes.data ?? []) as EvalRunRow[];
    const operations = new Map(
      ((operationsRes.data ?? []) as OperationalRow[]).map((row) => [canonicalId(row.agi_id), row]),
    );
    const agentsById = new Map(agents.map((row) => [canonicalId(row.agi_id), row]));

    const entries: AgiCertificationEntry[] = HOCKER_AGI_CANON.map((profile) => {
      const id = canonicalId(profile.id);
      const agent = agentsById.get(id);
      const operational = operations.get(id);
      const assignments = assignmentsByAgi.get(id) ?? [];
      const memoryReady = memories.some((row) => {
        const direct = row.agi_id ? canonicalId(row.agi_id) === id : false;
        const targeted = (row.target_agi_ids ?? []).some((target) => canonicalId(target) === id);
        return Boolean(row.active && (direct || targeted));
      });
      const isShadows = id === "shadows";
      const evalSuite = getAgiEvalSuite(id);
      const individualEvalReady = hasVerifiedRuntimeEval(evalFeedback, evalRuns, id, projectId);
      const toolsReady = isShadows
        ? assignments.length === 0
        : assignments.length > 0 && assignments.every(isAssignmentExecutorReady);

      const checks: Record<AgiCertificationCheck, boolean> = {
        canonical_profile: Boolean(agent),
        tools_ready: toolsReady,
        tool_runtime_evidence: hasVerifiedToolRuntimeEvidence(assignments, toolFeedback, id, individualEvalReady),
        memory_ready: memoryReady,
        runtime_evidence: (Number(operational?.tasks ?? 0) > 0) && (Number(operational?.runs ?? 0) > 0),
        allow_actions_guarded: agent?.allow_actions === false,
        eval_contract_suite: Boolean(evalSuite && evalSuite.version === AGI_EVAL_SUITE_VERSION && evalSuite.cases.length >= 3),
        individual_eval_suite: individualEvalReady,
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

    const runtime_eval_targets = entries
      .filter((entry) => !entry.checks.individual_eval_suite)
      .map((entry) => entry.agi_id);

    const tool_eval_targets: AgiToolEvalTarget[] = [];
    if (!queryFailed) {
      for (const [agiId, assignments] of assignmentsByAgi) {
        for (const assignment of assignments) {
          if (
            (assignment.tool_key === "supabase" || assignment.tool_key === "github")
            && !hasVerifiedToolAssignmentEvidence(assignment, toolFeedback, agiId)
          ) {
            tool_eval_targets.push({ agi_id: agiId, tool_key: assignment.tool_key });
          }
        }
      }
      tool_eval_targets.sort((a, b) => a.agi_id.localeCompare(b.agi_id) || a.tool_key.localeCompare(b.tool_key));
    }

    return {
      version: AGI_CERTIFICATION_VERSION,
      checked_at: checkedAt,
      source: queryFailed ? "partial" : "supabase+code",
      eval_suite_version: AGI_EVAL_SUITE_VERSION,
      tool_eval_version: AGI_TOOL_EVAL_VERSION,
      certified: entries.filter((entry) => entry.certified_for_current_scope).length,
      pending: entries.filter((entry) => !entry.certified_for_current_scope).length,
      entries,
      runtime_eval_targets: queryFailed ? entries.map((entry) => entry.agi_id) : runtime_eval_targets,
      tool_eval_targets,
    };
  } catch {
    const entries: AgiCertificationEntry[] = HOCKER_AGI_CANON.map((profile) => ({
      agi_id: canonicalId(profile.id),
      name: profile.name,
      status: "unknown",
      autonomy: "unknown",
      evidence_percent: 0,
      passed: 0,
      total: 8,
      certified_for_current_scope: false,
      checks: {
        canonical_profile: false,
        tools_ready: false,
        tool_runtime_evidence: false,
        memory_ready: false,
        runtime_evidence: false,
        allow_actions_guarded: false,
        eval_contract_suite: false,
        individual_eval_suite: false,
      },
      missing: [
        "canonical_profile",
        "tools_ready",
        "tool_runtime_evidence",
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
      tool_eval_version: AGI_TOOL_EVAL_VERSION,
      certified: 0,
      pending: entries.length,
      entries,
      runtime_eval_targets: entries.map((entry) => entry.agi_id),
      tool_eval_targets: [],
    };
  }
}
