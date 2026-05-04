import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { CHIDO_ACTION_CONTRACT_VERSION, getChidoActionContract } from "@/lib/chido-actions";
import { CHIDO_APPROVAL_EVENTS } from "@/lib/chido-approvals";
import {
  CHIDO_EXECUTION_PREFLIGHT_EVENT,
  CHIDO_EXECUTION_PREFLIGHT_VERSION,
} from "@/lib/chido-execution-preflight";
import { CHIDO_SIGNATURE_LAYER_VERSION } from "@/lib/chido-signatures";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

type Input = {
  approval_request_id?: string;
  requested_by?: string;
};

type EventRow = {
  id: string;
  type: string;
  created_at: string;
  data: JsonObject | null;
};

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

async function readInput(req: NextRequest): Promise<Input> {
  return (await req.json().catch(() => ({}))) as Input;
}

async function auditPreflight(data: JsonObject) {
  const sb = createAdminSupabase();

  const { data: inserted, error } = await sb
    .from("events")
    .insert({
      project_id: "chido-casino",
      level: data.preflight_passed === true ? "info" : "warn",
      type: CHIDO_EXECUTION_PREFLIGHT_EVENT,
      message: data.preflight_passed === true
        ? `Execution preflight aprobado en modo bloqueado para Chido Action: ${data.action_id}`
        : `Execution preflight rechazado para Chido Action: ${data.action_id ?? "unknown"}`,
      data,
    })
    .select("id")
    .single();

  if (error) throw error;
  return inserted?.id as string | undefined;
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const input = await readInput(req);

  const approvalRequestId = asText(input.approval_request_id);
  const requestedBy = asText(input.requested_by, "hocker-one");

  if (!approvalRequestId) {
    return NextResponse.json({
      ok: false,
      preflight_passed: false,
      execution_ready: false,
      executed: false,
      real_execution_enabled: false,
      execution_lock: true,
      trace_id: traceId,
      error: "Falta approval_request_id.",
    }, { status: 400 });
  }

  const sb = createAdminSupabase();

  const { data: requestEvent, error: requestError } = await sb
    .from("events")
    .select("id,type,created_at,data")
    .eq("project_id", "chido-casino")
    .eq("type", CHIDO_APPROVAL_EVENTS.request)
    .filter("data->>approval_request_id", "eq", approvalRequestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (requestError) {
    return NextResponse.json({
      ok: false,
      preflight_passed: false,
      execution_ready: false,
      executed: false,
      real_execution_enabled: false,
      execution_lock: true,
      trace_id: traceId,
      error: requestError.message,
    }, { status: 500 });
  }

  if (!requestEvent) {
    const eventId = await auditPreflight({
      trace_id: traceId,
      approval_request_id: approvalRequestId,
      preflight_passed: false,
      reason: "approval_request_not_found",
      execution_ready: false,
      executed: false,
      real_execution_enabled: false,
      execution_lock: true,
      requested_by: requestedBy,
      preflight_version: CHIDO_EXECUTION_PREFLIGHT_VERSION,
    } as JsonObject).catch(() => undefined);

    return NextResponse.json({
      ok: false,
      preflight_passed: false,
      execution_ready: false,
      executed: false,
      real_execution_enabled: false,
      execution_lock: true,
      trace_id: traceId,
      event_id: eventId,
      error: "Solicitud de aprobación no encontrada.",
    }, { status: 404 });
  }

  const requestData = asRecord(requestEvent.data);
  const actionId = asText(requestData.action_id);
  const expiresAt = asText(requestData.expires_at);
  const contract = getChidoActionContract(actionId);

  if (!contract) {
    const eventId = await auditPreflight({
      trace_id: traceId,
      approval_request_id: approvalRequestId,
      action_id: actionId,
      preflight_passed: false,
      reason: "contract_not_found",
      execution_ready: false,
      executed: false,
      real_execution_enabled: false,
      execution_lock: true,
      requested_by: requestedBy,
      preflight_version: CHIDO_EXECUTION_PREFLIGHT_VERSION,
    } as JsonObject).catch(() => undefined);

    return NextResponse.json({
      ok: false,
      preflight_passed: false,
      execution_ready: false,
      executed: false,
      real_execution_enabled: false,
      execution_lock: true,
      trace_id: traceId,
      event_id: eventId,
      error: `Contrato no encontrado para acción: ${actionId}`,
    }, { status: 400 });
  }

  const expires = expiresAt ? new Date(expiresAt).getTime() : 0;
  const ttlValid = Boolean(expires && Date.now() <= expires);

  const { data: decisionRows } = await sb
    .from("events")
    .select("id,type,created_at,data")
    .eq("project_id", "chido-casino")
    .eq("type", CHIDO_APPROVAL_EVENTS.decision)
    .filter("data->>approval_request_id", "eq", approvalRequestId)
    .order("created_at", { ascending: false })
    .limit(40);

  const decisions = ((decisionRows ?? []) as EventRow[]).map((event) => ({
    event,
    data: asRecord(event.data),
  }));

  const latestByGuardian = new Map<string, { event: EventRow; data: JsonObject }>();

  for (const item of decisions) {
    const guardian = asText(item.data.guardian_agi).toLowerCase();
    if (guardian && !latestByGuardian.has(guardian)) {
      latestByGuardian.set(guardian, item);
    }
  }

  const approvedGuardians = unique(
    contract.guardianAgis.filter((guardian) => {
      const item = latestByGuardian.get(guardian);
      return asText(item?.data.decision) === "approved";
    }),
  );

  const rejectedGuardians = unique(
    contract.guardianAgis.filter((guardian) => {
      const item = latestByGuardian.get(guardian);
      return asText(item?.data.decision) === "rejected";
    }),
  );

  const missingGuardians = unique(
    contract.guardianAgis.filter((guardian) => !approvedGuardians.includes(guardian)),
  );

  const guardiansComplete = missingGuardians.length === 0 && rejectedGuardians.length === 0;

  const { data: signatureRows } = await sb
    .from("events")
    .select("id,type,created_at,data")
    .eq("project_id", "chido-casino")
    .eq("type", "chido.action.signature_check")
    .filter("data->>approval_request_id", "eq", approvalRequestId)
    .order("created_at", { ascending: false })
    .limit(20);

  const signatureEvents = ((signatureRows ?? []) as EventRow[]).map((event) => ({
    event,
    data: asRecord(event.data),
  }));

  const latestVerifiedSignature = signatureEvents.find((item) => item.data.signature_verified === true);
  const signatureVerified = Boolean(latestVerifiedSignature);

  const preflightPassed =
    ttlValid &&
    contract.realExecutionEnabled === false &&
    contract.researchGateRequired === true &&
    guardiansComplete &&
    signatureVerified;

  const blockers = [
    ttlValid ? "" : "approval_expired_or_invalid_ttl",
    guardiansComplete ? "" : "guardian_approvals_incomplete",
    signatureVerified ? "" : "signature_not_verified",
    contract.realExecutionEnabled === false ? "" : "real_execution_unexpectedly_enabled",
    contract.researchGateRequired === true ? "" : "research_gate_not_required_unexpectedly",
  ].filter(Boolean);

  const auditData = {
    trace_id: traceId,
    approval_request_id: approvalRequestId,
    approval_request_event_id: requestEvent.id,
    action_id: contract.id,
    action_label: contract.label,
    risk_level: contract.riskLevel,
    preflight_passed: preflightPassed,
    blockers,
    ttl_valid: ttlValid,
    expires_at: expiresAt,
    guardian_agis_required: contract.guardianAgis,
    approved_guardians: approvedGuardians,
    rejected_guardians: rejectedGuardians,
    missing_guardians: missingGuardians,
    guardians_complete: guardiansComplete,
    signature_verified: signatureVerified,
    signature_event_id: latestVerifiedSignature?.event.id ?? null,
    research_gate_required: contract.researchGateRequired,
    required_before_real_execution: contract.requiredBeforeRealExecution,
    contract_version: CHIDO_ACTION_CONTRACT_VERSION,
    signature_layer_version: CHIDO_SIGNATURE_LAYER_VERSION,
    preflight_version: CHIDO_EXECUTION_PREFLIGHT_VERSION,
    requested_by: requestedBy,
    execution_ready: false,
    executed: false,
    real_execution_enabled: false,
    execution_lock: true,
    hard_block: "Execution preflight does not execute real actions.",
  } as JsonObject;

  const eventId = await auditPreflight(auditData).catch(() => undefined);

  return NextResponse.json({
    ok: true,
    preflight_passed: preflightPassed,
    execution_ready: false,
    executed: false,
    real_execution_enabled: false,
    execution_lock: true,
    event_id: eventId,
    trace_id: traceId,
    action_id: contract.id,
    blockers,
    approved_guardians: approvedGuardians,
    missing_guardians: missingGuardians,
    signature_verified: signatureVerified,
    message: preflightPassed
      ? "Preflight aprobado en modo bloqueado. La ejecución real sigue desactivada."
      : "Preflight no aprobado. La ejecución real sigue bloqueada.",
  });
}
