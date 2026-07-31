import { enqueueAgiAction } from "@/lib/agi-runtime-core";
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
  tool_key: "mcp";
  action_type: "mcp.execute";
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

  for (const raw of rawDrafts) {
    try {
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
          safety: {
            executed_now: false,
            validated_again_by_hocker_one: true,
            owner_gate_required: true,
            secrets_rejected: true,
          },
        },
        risk_level: risk,
        dry_run: true,
        requires_approval: true,
        created_by: params.created_by,
      });

      const record = row as JsonRecord;
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
