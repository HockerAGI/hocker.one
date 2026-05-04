import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { getChidoActionContract } from "@/lib/chido-actions";
import {
  CHIDO_APPROVAL_EVENTS,
  CHIDO_APPROVAL_LAYER_VERSION,
} from "@/lib/chido-approvals";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

type DecisionInput = {
  approval_request_id?: string;
  decision?: "approved" | "rejected";
  guardian_agi?: string;
  reason?: string;
  decided_by?: string;
};

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

async function readInput(req: NextRequest): Promise<DecisionInput> {
  return (await req.json().catch(() => ({}))) as DecisionInput;
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const input = await readInput(req);

  const approvalRequestId = asText(input.approval_request_id);
  const decision = asText(input.decision) as "approved" | "rejected";
  const guardianAgi = asText(input.guardian_agi).toLowerCase();
  const reason = asText(input.reason);
  const decidedBy = asText(input.decided_by, "hocker-one");

  if (!approvalRequestId) {
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      error: "Falta approval_request_id.",
    }, { status: 400 });
  }

  if (!["approved", "rejected"].includes(decision)) {
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      error: "decision debe ser approved o rejected.",
    }, { status: 400 });
  }

  if (!guardianAgi) {
    return NextResponse.json({
      ok: false,
      dry_run: true,
      executed: false,
      trace_id: traceId,
      error: "Falta guardian_agi.",
    }, { status: 400 });
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
      error: "La solicitud ya tiene una decisión registrada.",
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
