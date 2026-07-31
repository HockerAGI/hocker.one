import { randomUUID } from "node:crypto";
import {
  executeApprovedAgiAction,
  type AgiActionQueueRow,
} from "@/lib/agi-action-execution";
import {
  executeValidatedMcpDraft,
  validateDeferredMcpDraft,
} from "@/lib/mcp/mcp-policy";
import { createAdminSupabase } from "@/lib/supabase-admin";

type JsonRecord = Record<string, unknown>;

type ExecuteParams = {
  project_id: string;
  action_id: string;
  actor_id: string;
};

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function getQueueItem(projectId: string, actionId: string): Promise<AgiActionQueueRow> {
  const db = createAdminSupabase();
  const { data, error } = await db
    .from("agi_action_queue")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", actionId)
    .maybeSingle<AgiActionQueueRow>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acción AGI no encontrada.");
  return data;
}

async function patchQueueItem(
  projectId: string,
  actionId: string,
  patch: Partial<AgiActionQueueRow>,
): Promise<AgiActionQueueRow> {
  const db = createAdminSupabase();
  const { data, error } = await db
    .from("agi_action_queue")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("id", actionId)
    .select("*")
    .single<AgiActionQueueRow>();

  if (error || !data) throw new Error(error?.message ?? "No se pudo actualizar la acción AGI.");
  return data;
}

async function claimApprovedMcpAction(
  params: ExecuteParams,
  pending: AgiActionQueueRow,
): Promise<AgiActionQueueRow> {
  const attemptCount = numberValue(pending.attempt_count, 0);
  const maxAttempts = Math.max(1, numberValue(pending.max_attempts, 3));

  if (attemptCount >= maxAttempts) {
    throw new Error(`Acción agotó intentos permitidos: ${attemptCount}/${maxAttempts}`);
  }

  const now = new Date().toISOString();
  const db = createAdminSupabase();
  const { data, error } = await db
    .from("agi_action_queue")
    .update({
      status: "executing",
      executed_by: params.actor_id,
      locked_at: now,
      lock_owner: `hocker-one:mcp:${params.actor_id}:${randomUUID()}`,
      attempt_count: attemptCount + 1,
      last_error: null,
      updated_at: now,
    })
    .eq("project_id", params.project_id)
    .eq("id", params.action_id)
    .eq("status", "approved")
    .is("locked_at", null)
    .select("*")
    .maybeSingle<AgiActionQueueRow>();

  if (error) throw new Error(error.message);
  if (!data) {
    const latest = await getQueueItem(params.project_id, params.action_id);
    throw new Error(
      `No se pudo reclamar el lock MCP. Estado actual: ${latest.status}; locked_at=${latest.locked_at ?? "null"}`,
    );
  }

  return data;
}

async function executeApprovedMcpAction(
  params: ExecuteParams,
  pending: AgiActionQueueRow,
): Promise<AgiActionQueueRow> {
  if (pending.status !== "approved") {
    throw new Error(`Acción no aprobada. Estado actual: ${pending.status}`);
  }
  if (pending.tool_key !== "mcp" || pending.action_type !== "mcp.execute") {
    throw new Error("La acción no pertenece al trabajador MCP aprobado.");
  }
  if (pending.requires_approval !== true) {
    throw new Error("Acción MCP sin contrato explícito de aprobación.");
  }

  const item = await claimApprovedMcpAction(params, pending);
  const payload = asRecord(item.payload);

  try {
    const draft = validateDeferredMcpDraft({
      draft_id: payload.draft_id ?? randomUUID(),
      action_type: "mcp.execute",
      tool_key: "mcp",
      provider: payload.provider,
      tool: payload.tool,
      args: asRecord(payload.args),
      requires_approval: true,
      execution_target: "hocker.one.owner-gate",
    });

    const data = await executeValidatedMcpDraft(draft);
    const executedAt = new Date().toISOString();

    return patchQueueItem(params.project_id, item.id, {
      status: "executed",
      executed_by: params.actor_id,
      executed_at: executedAt,
      locked_at: null,
      lock_owner: null,
      last_error: null,
      execution_error: null,
      rollback_plan: {
        type: "mcp.provider_specific_manual_review",
        safe: false,
        provider: draft.provider,
        tool: draft.tool,
        note: "El rollback depende de la herramienta. Revisa la evidencia antes de compensar o revertir.",
      },
      execution_result: {
        ok: true,
        executed_at: executedAt,
        worker: "mcp_approved_execution_worker_1.0",
        idempotency_key: item.idempotency_key ?? null,
        attempt_count: item.attempt_count ?? null,
        result: {
          operation: "mcp.execute",
          provider: draft.provider,
          tool: draft.tool,
          qualified_name: draft.qualified_name,
          data,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falla desconocida al ejecutar acción MCP.";

    try {
      await patchQueueItem(params.project_id, item.id, {
        status: "execution_failed",
        executed_by: params.actor_id,
        executed_at: new Date().toISOString(),
        locked_at: null,
        lock_owner: null,
        last_error: message,
        execution_error: message,
        execution_result: {
          ok: false,
          worker: "mcp_approved_execution_worker_1.0",
          idempotency_key: item.idempotency_key ?? null,
          attempt_count: item.attempt_count ?? null,
        },
      });
    } catch {
      // Preserve the original execution failure; the stale lock remains visible for recovery.
    }

    throw error;
  }
}

export async function executeApprovedAgiActionUniversal(
  params: ExecuteParams,
): Promise<AgiActionQueueRow> {
  const pending = await getQueueItem(params.project_id, params.action_id);
  const hasMcpTool = pending.tool_key === "mcp";
  const hasMcpAction = pending.action_type === "mcp.execute";

  if (hasMcpTool !== hasMcpAction) {
    throw new Error("Contrato de trabajador inconsistente: tool_key y action_type no coinciden.");
  }

  if (hasMcpTool && hasMcpAction) {
    return executeApprovedMcpAction(params, pending);
  }

  return executeApprovedAgiAction(params);
}
