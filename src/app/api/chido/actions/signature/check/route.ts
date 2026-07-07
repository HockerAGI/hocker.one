import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { CHIDO_APPROVAL_EVENTS } from "@/lib/chido-approvals";
import {
  CHIDO_SIGNATURE_LAYER_VERSION,
  buildChidoSignatureBase,
  getChidoHmacSecret,
  isChidoSignatureTimestampFresh,
  verifyChidoSignature,
  type ChidoSignaturePayload,
} from "@/lib/chido-signatures";
import { ChidoSignatureCheckSchema } from "@/lib/chido-schemas";
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

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function auditSignatureCheck(data: JsonObject, ok: boolean) {
  const sb = createAdminSupabase();

  const { data: inserted, error } = await sb
    .from("events")
    .insert({
      project_id: "chido-casino",
      level: ok ? "info" : "warn",
      type: "chido.action.signature_check",
      message: ok
        ? `Firma HMAC válida para Chido Action: ${data.action_id}`
        : `Firma HMAC rechazada para Chido Action: ${data.action_id ?? "unknown"}`,
      data,
    })
    .select("id")
    .single();

  if (error) throw error;

  return inserted?.id as string | undefined;
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
  if (ownerGateResponse) return ownerGateResponse;

  const raw = await req.json().catch(() => ({}));
  const parsed = ChidoSignatureCheckSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json({
      ok: false,
      signature_verified: false,
      executed: false,
      trace_id: traceId,
      error: firstError?.message ?? "Body inválido.",
    }, { status: 400 });
  }
  const input = parsed.data;

  const approvalRequestId = input.approval_request_id;
  const timestamp = input.timestamp;
  const nonce = input.nonce;
  const signature = input.signature.toLowerCase();
  const requestedBy = input.requested_by;

  if (!getChidoHmacSecret()) {
    return NextResponse.json({
      ok: false,
      signature_verified: false,
      executed: false,
      trace_id: traceId,
      error: "CHIDO_ACTION_HMAC_SECRET no está configurado.",
    }, { status: 503 });
  }

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
      signature_verified: false,
      executed: false,
      trace_id: traceId,
      error: requestError.message,
    }, { status: 500 });
  }

  if (!requestEvent) {
    const eventId = await auditSignatureCheck({
      trace_id: traceId,
      approval_request_id: approvalRequestId,
      signature_verified: false,
      dry_run: true,
      executed: false,
      real_execution_enabled: false,
      error: "approval_request_not_found",
      requested_by: requestedBy,
      signature_layer_version: CHIDO_SIGNATURE_LAYER_VERSION,
    } as JsonObject, false).catch(() => undefined);

    return NextResponse.json({
      ok: false,
      signature_verified: false,
      executed: false,
      trace_id: traceId,
      event_id: eventId,
      error: "Solicitud de aprobación no encontrada.",
    }, { status: 404 });
  }

  const requestData = asRecord(requestEvent.data);
  const actionId = asText(requestData.action_id);
  const targetIdHash = asText(requestData.target_id_hash);

  const { data: decisionEvent } = await sb
    .from("events")
    .select("id,data,created_at")
    .eq("project_id", "chido-casino")
    .eq("type", CHIDO_APPROVAL_EVENTS.decision)
    .filter("data->>approval_request_id", "eq", approvalRequestId)
    .filter("data->>decision", "eq", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasApprovedDecision = Boolean(decisionEvent);

  const payload: ChidoSignaturePayload = {
    approval_request_id: approvalRequestId,
    action_id: actionId,
    target_id_hash: targetIdHash,
    timestamp,
    nonce,
  };

  const timestampFresh = isChidoSignatureTimestampFresh(timestamp);
  const signatureVerified = timestampFresh && hasApprovedDecision && verifyChidoSignature(payload, signature);

  const data = {
    trace_id: traceId,
    approval_request_id: approvalRequestId,
    action_id: actionId,
    signature_verified: signatureVerified,
    signature_hash: hashText(signature),
    timestamp,
    nonce_hash: hashText(nonce),
    timestamp_fresh: timestampFresh,
    approved_decision_required: true,
    approved_decision_found: hasApprovedDecision,
    dry_run: true,
    executed: false,
    real_execution_enabled: false,
    execution_ready: false,
    execution_lock: true,
    requested_by: requestedBy,
    signature_base_preview: buildChidoSignatureBase(payload).replace(targetIdHash, `${targetIdHash.slice(0, 10)}…`),
    signature_layer_version: CHIDO_SIGNATURE_LAYER_VERSION,
  } as JsonObject;

  const eventId = await auditSignatureCheck(data, signatureVerified).catch(() => undefined);

  if (!timestampFresh) {
    return NextResponse.json({
      ok: false,
      signature_verified: false,
      executed: false,
      trace_id: traceId,
      event_id: eventId,
      error: "Timestamp fuera de ventana permitida.",
    }, { status: 401 });
  }

  if (!hasApprovedDecision) {
    return NextResponse.json({
      ok: false,
      signature_verified: false,
      executed: false,
      trace_id: traceId,
      event_id: eventId,
      error: "La solicitud necesita una decisión approved antes de verificar firma.",
    }, { status: 409 });
  }

  if (!signatureVerified) {
    return NextResponse.json({
      ok: false,
      signature_verified: false,
      executed: false,
      trace_id: traceId,
      event_id: eventId,
      error: "Firma HMAC inválida.",
    }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    signature_verified: true,
    executed: false,
    trace_id: traceId,
    event_id: eventId,
    approval_request_id: approvalRequestId,
    action_id: actionId,
    execution_ready: false,
    real_execution_enabled: false,
    execution_lock: true,
    message: "Firma HMAC válida. La ejecución real sigue bloqueada.",
  });
}
