import { enqueueAgiAction } from "@/lib/agi-runtime-core";
import { getAgiQueueLock } from "@/lib/agi-queue-lock";
import {
  createGitHubWriteGatePlan,
  executeGitHubReadOperation,
  hasGitHubRuntimeToken,
  readGitHubBranchHeadSha,
  type GitHubRuntimeWriteOperation,
} from "@/lib/github-runtime-executor";
import {
  NOVA_GITHUB_GUIDED_CHAIN_VERSION,
  NOVA_GITHUB_PROPOSAL_TOOL,
  parseNovaGithubCodeProposal,
} from "@/lib/nova-github-proposal";
import {
  assertMcpToolAvailable,
  isReadOnlyMcpTool,
  validateDeferredMcpDraft,
  type ValidatedMcpDraft,
} from "@/lib/mcp/mcp-policy";

type JsonRecord = Record<string, unknown>;

type MaterializedMcpAction = {
  id: string | null;
  status: string;
  tool_key: "mcp" | "github";
  action_type: "mcp.execute" | "github.create_branch" | "github.upsert_file" | "github.create_pr";
  title: string;
  risk_level: "medium" | "high";
  provider: string;
  tool: string;
  qualified_name: string;
};

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function compact(value: unknown, max = 480): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function extractDrafts(meta: unknown): unknown[] {
  const root = asRecord(meta);
  const mcp = asRecord(root.mcp);
  return Array.isArray(mcp.deferred_actions) ? mcp.deferred_actions.slice(0, 8) : [];
}

function riskFor(draft: ValidatedMcpDraft): "medium" | "high" {
  if (["supabase", "github", "vercel"].includes(draft.provider)) return "high";
  return "medium";
}

function isGithubLifecycleMutation(tool: string): boolean {
  return new Set(["create_branch", "create_or_update_file", "create_file", "update_file", "create_pull_request"]).has(tool);
}

function isNativeGithubProposalDraft(raw: unknown): boolean {
  const draft = asRecord(raw);
  return draft.provider === "github" &&
    draft.tool === NOVA_GITHUB_PROPOSAL_TOOL &&
    draft.action_type === "github.propose_code_change";
}

export async function materializeNovaMcpActionsFromUpstream(params: {
  project_id: string;
  created_by: string;
  original_message: string;
  trace_id?: string | null;
  upstream_meta: unknown;
}): Promise<{
  actions: MaterializedMcpAction[];
  rejected: Array<{ reason: string }>;
}> {
  const rawDrafts = extractDrafts(params.upstream_meta);
  const actions: MaterializedMcpAction[] = [];
  const rejected: Array<{ reason: string }> = [];

  // Reuse the same project-scoped, fail-closed Queue Lock as NOVA Chat.
  // Check just before materialization, after model/tool planning, because the
  // queue may have changed while NOVA was reading the repository.
  // One accepted request can still contain its ordered GitHub lifecycle steps.
  if (rawDrafts.length > 0) {
    const queueLock = await getAgiQueueLock(params.project_id);
    if (queueLock.locked || queueLock.can_start_new_task !== true) {
      return {
        actions,
        rejected: rawDrafts.map(() => ({
          reason: "Queue Lock activo: no se materializaron acciones MCP; revisa la cola existente.",
        })),
      };
    }
  }

  if (rawDrafts.filter(isNativeGithubProposalDraft).length > 1) {
    return {
      actions,
      rejected: rawDrafts.map(() => ({ reason: "NOVA_GITHUB_MULTIPLE_PROPOSALS_BLOCKED" })),
    };
  }

  let previousGithubLifecycleActionId: string | null = null;

  for (const raw of rawDrafts) {
    try {
      if (isNativeGithubProposalDraft(raw)) {
        actions.push(...await materializeNativeGithubProposal(params, raw));
        continue;
      }

      const draft = validateDeferredMcpDraft(raw);
      await assertMcpToolAvailable(draft.provider, draft.tool);

      if (isReadOnlyMcpTool(draft.provider, draft.tool)) {
        rejected.push({ reason: `${draft.qualified_name} es de lectura y no debe entrar a la cola de escritura.` });
        continue;
      }

      const risk = riskFor(draft);
      const row = await enqueueAgiAction({
        project_id: params.project_id,
        agi_id: "nova",
        tool_key: "mcp",
        action_type: "mcp.execute",
        title: `MCP · ${draft.qualified_name}`,
        payload: {
          provider: draft.provider,
          tool: draft.tool,
          args: draft.args,
          qualified_name: draft.qualified_name,
          draft_id: draft.draft_id,
          source: "nova_mcp_owner_gate_bridge",
          trace_id: params.trace_id ?? null,
          request_preview: compact(params.original_message),
          depends_on_action_id: draft.provider === "github" && isGithubLifecycleMutation(draft.tool)
            ? previousGithubLifecycleActionId
            : null,
          safety: {
            executed_now: false,
            validated_again_by_hocker_one: true,
            owner_gate_required: true,
            secrets_rejected: true,
            lifecycle_ordered: draft.provider === "github" && isGithubLifecycleMutation(draft.tool),
          },
        },
        risk_level: risk,
        dry_run: true,
        requires_approval: true,
        created_by: params.created_by,
      });

      const record = row as JsonRecord;
      if (draft.provider === "github" && isGithubLifecycleMutation(draft.tool) && typeof record.id === "string") {
        previousGithubLifecycleActionId = record.id;
      }
      actions.push({
        id: typeof record.id === "string" ? record.id : null,
        status: String(record.status ?? "needs_approval"),
        tool_key: "mcp",
        action_type: "mcp.execute",
        title: String(record.title ?? `MCP · ${draft.qualified_name}`),
        risk_level: risk,
        provider: draft.provider,
        tool: draft.tool,
        qualified_name: draft.qualified_name,
      });
    } catch (error) {
      rejected.push({
        reason: error instanceof Error ? error.message : "Borrador MCP rechazado.",
      });
    }
  }

  return { actions, rejected };
}

/**
 * Bridge the model's verified local proposal to the EXISTING GitHub worker.
 * The GitHub MCP provider remains read-only; no MCP mutation is dispatched.
 */
async function materializeNativeGithubProposal(
  params: { project_id: string; created_by: string; original_message: string; trace_id?: string | null },
  raw: unknown,
): Promise<MaterializedMcpAction[]> {
  const draft = asRecord(raw);
  if (draft.tool_key !== "github" ||
      draft.requires_approval !== true ||
      draft.execution_target !== "hocker.one.owner-gate") {
    throw new Error("NOVA_GITHUB_PROPOSAL_INVALID_OWNER_GATE_ENVELOPE");
  }
  if (!hasGitHubRuntimeToken()) throw new Error("NOVA_GITHUB_EXECUTOR_NOT_CONFIGURED");

  const proposal = parseNovaGithubCodeProposal(draft.args);
  const observedBaseSha = await readGitHubBranchHeadSha(proposal.repository, "main");
  if (!observedBaseSha || observedBaseSha !== proposal.expected_base_sha) {
    throw new Error("NOVA_GITHUB_BASE_SHA_NOT_CURRENT");
  }
  const existingBranch = await readGitHubBranchHeadSha(proposal.repository, proposal.branch);
  if (existingBranch) throw new Error("NOVA_GITHUB_BRANCH_ALREADY_EXISTS");

  // Every file is independently checked against the exact baseline GitHub
  // commit before ANY action enters the queue. A batch fails wholly on a
  // stale SHA, truncated read or no-op; never enqueue partial unverified data.
  for (const file of proposal.changes) {
    const observedFile = asRecord(await executeGitHubReadOperation("read_file", {
      repository: proposal.repository, ref: "main", path: file.path,
    }));
    if (observedFile.truncated === true || observedFile.sha !== file.expected_file_sha ||
        typeof observedFile.content !== "string") {
      throw new Error("NOVA_GITHUB_FILE_SHA_NOT_VERIFIED");
    }
    if (observedFile.content === file.content) {
      throw new Error("NOVA_GITHUB_NO_ACTUAL_FILE_CHANGE");
    }
  }

  const common = {
    repository: proposal.repository,
    base: "main",
    base_branch: "main",
    branch: proposal.branch,
    target_branch: proposal.branch,
    expected_base_sha: proposal.expected_base_sha,
    require_new_branch: true,
  };

  const steps: Array<{ operation: "create_branch" | "upsert_file" | "create_pr"; payload: Record<string, unknown> }> = [
    { operation: "create_branch", payload: { ...common, message: "NOVA prepare " + proposal.branch } },
    ...proposal.changes.map((file, index) => ({
      operation: "upsert_file" as const,
      payload: {
        ...common, path: file.path, expected_sha: file.expected_file_sha,
        content: file.content, message: proposal.commit_message + " (" + String(index + 1) + "/" +
          String(proposal.changes.length) + ")",
      },
    })),
    { operation: "create_pr", payload: {
      ...common, head: proposal.branch, title: proposal.pr_title, body: proposal.pr_body,
    } },
  ];

  // Prevalidate the ENTIRE sequence before the first queue insert.
  const planned = steps.map(({ operation, payload }) => {
    const plan = createGitHubWriteGatePlan(operation as GitHubRuntimeWriteOperation, payload);
    if (!plan.valid) throw new Error("NOVA_GITHUB_WRITE_PLAN_INCOMPLETE");
    return { operation, payload, plan };
  });

  const actions: MaterializedMcpAction[] = [];
  for (const [stepIndex, { operation, payload, plan }] of planned.entries()) {
    const row = await enqueueAgiAction({
      project_id: params.project_id,
      agi_id: "nova",
      tool_key: "github",
      action_type: "github." + operation,
      title: "NOVA · " + (operation === "create_branch" ? "Crear rama" :
        operation === "upsert_file" ? "Aplicar cambio a " + String(payload.path) : "Abrir PR draft"),
      payload: {
        ...payload,
        materializer_version: NOVA_GITHUB_GUIDED_CHAIN_VERSION,
        sequence_index: stepIndex,
        source: "nova_native_github_proposal",
        trace_id: params.trace_id ?? null,
        request_preview: compact(params.original_message),
        write_plan: plan,
        safety: {
          executed_now: false, owner_gate_required: true, no_direct_main_write: true,
          verified_main_sha: proposal.expected_base_sha,
          verified_file_sha: operation === "upsert_file" ? payload.expected_sha : null,
          git_mcp_read_only: true,
        },
      },
      risk_level: plan.risk_level,
      dry_run: true,
      requires_approval: true,
      created_by: params.created_by,
    });
    const record = asRecord(row);
    actions.push({
      id: typeof record.id === "string" ? record.id : null,
      status: String(record.status ?? "needs_approval"),
      tool_key: "github",
      action_type: ("github." + operation) as MaterializedMcpAction["action_type"],
      title: String(record.title ?? "NOVA GitHub " + operation),
      risk_level: plan.risk_level,
      provider: "github",
      tool: NOVA_GITHUB_PROPOSAL_TOOL,
      qualified_name: "github." + NOVA_GITHUB_PROPOSAL_TOOL,
    });
  }
  return actions;
}
