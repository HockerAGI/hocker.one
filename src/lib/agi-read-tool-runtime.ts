import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AGI_TOOL_EVAL_VERSION } from "@/lib/agi-certification";
import { executeGitHubReadOperation } from "@/lib/github-runtime-executor";
import { canonicalAgiId } from "@/lib/hocker-agi-operational";
import { createAdminSupabase } from "@/lib/supabase-admin";

type UntypedSupabase = SupabaseClient<any, "public", any>;
type JsonRecord = Record<string, unknown>;

export const SUPPORTED_READ_TOOL_KEYS = ["supabase", "github"] as const;
export type SupportedReadToolKey = (typeof SUPPORTED_READ_TOOL_KEYS)[number];

export type AgiReadToolProbeResult = {
  ok: true;
  project_id: "hocker-one";
  agi_id: string;
  tool_key: SupportedReadToolKey;
  mode: "read_only";
  passed: true;
  external_writes_executed: false;
  evidence_ref: string;
  checked_at: string;
  summary: Record<string, string | boolean | null>;
};

function db(): UntypedSupabase {
  return createAdminSupabase() as unknown as UntypedSupabase;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function parsePolicy(value: unknown): JsonRecord {
  return asRecord(value);
}

function assertExecutorReady(policyValue: unknown): void {
  const policy = parsePolicy(policyValue);
  const normalized_status = String(policy.normalized_status ?? "");
  const implementation_status = String(policy.implementation_status ?? "");
  const execution_enabled = policy.execution_enabled === true;
  if (
    normalized_status !== "connected"
    || implementation_status !== "executor_ready"
    || !execution_enabled
  ) {
    throw new Error("AGI_TOOL_ASSIGNMENT_NOT_EXECUTOR_READY");
  }
}

async function loadEffectiveAssignment(projectId: string, agiId: string, toolKey: string) {
  const { data, error } = await db()
    .from("agi_agent_tools")
    .select("agi_id,tool_key,enabled,permission_level,policy")
    .eq("project_id", projectId)
    .eq("agi_id", agiId)
    .eq("tool_key", toolKey)
    .eq("enabled", true)
    .maybeSingle();

  if (error) throw new Error("AGI_TOOL_ASSIGNMENT_LOOKUP_FAILED");
  if (!data) throw new Error("AGI_TOOL_NOT_ASSIGNED");
  assertExecutorReady(data.policy);
  return data;
}

async function probeSupabase(projectId: string, agiId: string) {
  const { data, error } = await db()
    .from("agi_agents")
    .select("agi_id,status,autonomy_level,allow_actions")
    .eq("project_id", projectId)
    .eq("agi_id", agiId)
    .maybeSingle();

  if (error) throw new Error("AGI_SUPABASE_READ_PROBE_FAILED");
  if (!data) throw new Error("AGI_SUPABASE_PROFILE_NOT_FOUND");

  return {
    provider: "Supabase",
    profile_found: true,
    status: String(data.status ?? "unknown"),
    autonomy: String(data.autonomy_level ?? "unknown"),
    actions_guarded: data.allow_actions === false,
  };
}

async function probeGitHub() {
  const result = asRecord(await executeGitHubReadOperation("get_repo", {
    repository: "HockerAGI/hocker.one",
  }));

  if (String(result.repository ?? "") !== "HockerAGI/hocker.one") {
    throw new Error("AGI_GITHUB_READ_PROBE_MISMATCH");
  }

  return {
    provider: "GitHub",
    repo_found: true,
    default_branch: String(result.default_branch ?? "unknown"),
    private: result.private === true,
    pushed_at: typeof result.pushed_at === "string" ? result.pushed_at : null,
  };
}

export async function runAgiReadOnlyToolProbe(input: {
  agi_id: string;
  tool_key: string;
  actor_user_id: string;
}): Promise<AgiReadToolProbeResult> {
  const projectId = "hocker-one" as const;
  const agiId = canonicalAgiId(input.agi_id);
  const toolKey = String(input.tool_key).trim().toLowerCase();

  if (toolKey === "ai_gateway") {
    throw new Error("AI_GATEWAY_ALREADY_COVERED_BY_AGI_EVAL");
  }
  if (!SUPPORTED_READ_TOOL_KEYS.includes(toolKey as SupportedReadToolKey)) {
    throw new Error("AGI_TOOL_READ_PROBE_NOT_SUPPORTED");
  }

  await loadEffectiveAssignment(projectId, agiId, toolKey);

  const checkedAt = new Date().toISOString();
  const summary = toolKey === "supabase"
    ? await probeSupabase(projectId, agiId)
    : await probeGitHub();
  const evidenceHash = sha256({
    project_id: projectId,
    agi_id: agiId,
    tool_key: toolKey,
    mode: "read_only",
    checked_at: checkedAt,
    summary,
    external_writes_executed: false,
  });
  const evidence_ref = `agi-tool-eval:${AGI_TOOL_EVAL_VERSION}:${agiId}:${toolKey}:${evidenceHash}`;

  const payload = {
    tool_eval_version: AGI_TOOL_EVAL_VERSION,
    tool_key: toolKey,
    passed: true,
    mode: "read_only",
    external_writes_executed: false,
    evidence_ref,
    evidence_hash: evidenceHash,
    checked_at: checkedAt,
  };

  const { error: feedbackError } = await db().from("agi_feedback").insert({
    project_id: projectId,
    agi_id: agiId,
    feedback_type: "agi_tool_eval_result",
    message: `${toolKey} read-only runtime probe passed.`,
    payload,
    created_by: input.actor_user_id,
  });
  if (feedbackError) throw new Error("AGI_TOOL_EVIDENCE_WRITE_FAILED");

  return {
    ok: true,
    project_id: projectId,
    agi_id: agiId,
    tool_key: toolKey as SupportedReadToolKey,
    mode: "read_only",
    passed: true,
    external_writes_executed: false,
    evidence_ref,
    checked_at: checkedAt,
    summary,
  };
}
