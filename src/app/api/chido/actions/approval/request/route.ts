import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  CHIDO_ACTION_CONTRACT_VERSION,
  getChidoActionContract,
  getChidoBlockedAction,
  isChidoBlockedAction,
} from "@/lib/chido-actions";
import {
  CHIDO_APPROVAL_EVENTS,
  CHIDO_APPROVAL_LAYER_VERSION,
  chidoApprovalExpiresAt,
} from "@/lib/chido-approvals";
import { ChidoApprovalRequestSchema } from "@/lib/chido-schemas";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function preview(value: unknown): string {
  const text = asText(value);
  if (!text) return "";
  return text.length > 12 ? `${text.slice(0, 10)}…` : text;
}

function hashValue(value: unknown): string {
  const text = asText(value);
  if (!text) return "";
  return createHash("sha256").update(text).digest("hex");
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
  if (ownerGateResponse) return ownerGateResponse;

  const raw = await req.json().catch(() => ({}));
  const parsed = ChidoApprovalRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      error: firstError?.message ?? "Body inválido.",
    }, { status: 400 });
  }
  const input = parsed.data;

  const actionId = input.action;
  const targetId = input.target_id;
  const reason = input.reason;
  const requestedBy = input.requested_by;

  if (isChidoBlockedAction(actionId)) {
    const blocked = getChidoBlockedAction(actionId);

    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      blocked: true,
      trace_id: traceId,
      action_id: actionId,
      reason: blocked?.reason ?? "Acción bloqueada.",
    }, { status: 403 });
  }

  const contract = getChidoActionContract(actionId);

  if (!contract) {
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      error: `Acción no permitida: ${actionId}`,
    }, { status: 400 });
  }

  const now = new Date();
  const approvalRequestId = randomUUID();

  const data = {
    approval_request_id: approvalRequestId,
    trace_id: traceId,
    action_id: contract.id,
    action_label: contract.label,
    status: "pending",
    risk_level: contract.riskLevel,
    guardian_agis_required: contract.guardianAgis,
    required_before_real_execution: contract.requiredBeforeRealExecution,
    requested_by: requestedBy,
    reason,
    target_id_preview: preview(targetId),
    target_id_hash: hashValue(targetId),
    created_at: now.toISOString(),
    expires_at: chidoApprovalExpiresAt(now),
    dry_run: true,
    executed: false,
    real_execution_enabled: false,
    research_gate_required: true,
    execution_lock: true,
    contract_version: CHIDO_ACTION_CONTRACT_VERSION,
    approval_layer_version: CHIDO_APPROVAL_LAYER_VERSION,
  } as JsonObject;

  const sb = createAdminSupabase();

  const { data: inserted, error } = await sb
    .from("events")
    .insert({
      project_id: "chido-casino",
      level: "info",
      type: CHIDO_APPROVAL_EVENTS.request,
      message: `Solicitud de aprobación creada para Chido Action: ${contract.id}`,
      data,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      error: error.message,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    dry_run: true,
    executed: false,
    approval_request_id: approvalRequestId,
    event_id: inserted?.id,
    status: "pending",
    expires_at: data.expires_at,
    action: {
      id: contract.id,
      label: contract.label,
      riskLevel: contract.riskLevel,
      guardianAgis: contract.guardianAgis,
      requiredBeforeRealExecution: contract.requiredBeforeRealExecution,
      realExecutionEnabled: false,
      researchGateRequired: true,
    },
    message: "Solicitud de aprobación creada. No se ejecutó ninguna acción real.",
  });
}
