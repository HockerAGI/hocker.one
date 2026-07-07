import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { getChidoActionContract } from "@/lib/chido-actions";
import {
  CHIDO_APPROVAL_EVENTS,
  CHIDO_APPROVAL_LAYER_VERSION,
} from "@/lib/chido-approvals";
import { ChidoApprovalDecisionSchema } from "@/lib/chido-schemas";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
  if (ownerGateResponse) return ownerGateResponse;

  const raw = await req.json().catch(() => ({}));
  const parsed = ChidoApprovalDecisionSchema.safeParse(raw);
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

  const approvalRequestId = input.approval_request_id;
  const decision = input.decision;
  const guardianAgi = input.guardian_agi.toLowerCase();
  const reason = input.reason;
  const decidedBy = input.decided_by;

  const sb = createAdminSupabase();

  const { data: requestEvent, error: requestError } = await sb
    .from("events")
    .select("id,data,created_at")
    .eq("project_id", "chido-casino")
    .eq("type", CHIDO_APPROVAL_EVENTS.request)
    .filter("data->>approval_request_id", "eq", approvalRequestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (requestError) {
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      error: requestError.message,
    }, { status: 500 });
  }

  if (!requestEvent) {
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      error: "Solicitud de aprobación no encontrada.",
    }, { status: 404 });
  }

  const requestData = asRecord(requestEvent.data);
  const actionId = asText(requestData.action_id);
  const expiresAt = asText(requestData.expires_at);
  const contract = getChidoActionContract(actionId);

  if (!contract) {
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      error: `Contrato no encontrado para acción: ${actionId}`,
    }, { status: 400 });
  }

  if (!contract.guardianAgis.includes(guardianAgi)) {
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      error: `Guardian AGI no autorizada para esta acción: ${guardianAgi}`,
      required_guardians: contract.guardianAgis,
    }, { status: 403 });
  }

  const expires = expiresAt ? new Date(expiresAt).getTime() : 0;
  if (expires && Date.now() > expires) {
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      status: "expired",
      error: "La solicitud de aprobación expiró.",
    }, { status: 409 });
  }

  const { data: existingDecision } = await sb
    .from("events")
    .select("id,data,created_at")
    .eq("project_id", "chido-casino")
    .eq("type", CHIDO_APPROVAL_EVENTS.decision)
    .filter("data->>approval_request_id", "eq", approvalRequestId)
    .filter("data->>guardian_agi", "eq", guardianAgi)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingDecision) {
    const existing = asRecord(existingDecision.data);

    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      status: asText(existing.decision, "decided"),
      error: "Esta guardian AGI ya registró una decisión para esta solicitud.",
      existing_event_id: existingDecision.id,
    }, { status: 409 });
  }

  const data = {
    approval_request_id: approvalRequestId,
    trace_id: traceId,
    action_id: actionId,
    decision,
    guardian_agi: guardianAgi,
    decided_by: decidedBy,
    reason,
    dry_run: true,
    executed: false,
    real_execution_enabled: false,
    execution_lock: true,
    approval_layer_version: CHIDO_APPROVAL_LAYER_VERSION,
  } as JsonObject;

  const { data: inserted, error } = await sb
    .from("events")
    .insert({
      project_id: "chido-casino",
      level: decision === "approved" ? "info" : "warn",
      type: CHIDO_APPROVAL_EVENTS.decision,
      message: `Solicitud Chido ${decision}: ${actionId}`,
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
    status: decision,
    action_id: actionId,
    guardian_agi: guardianAgi,
    message: "Decisión registrada. La acción real sigue bloqueada.",
  });
}
