import { randomUUID, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  CHIDO_ACTION_CONTRACT_VERSION,
  getChidoActionContract,
  getChidoBlockedAction,
  isChidoBlockedAction,
} from "@/lib/chido-actions";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

type DryRunInput = {
  action?: string;
  target_id?: string;
  reason?: string;
  requested_by?: string;
  payload?: unknown;
};

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function preview(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "";
  return text.length > 12 ? `${text.slice(0, 10)}…` : text;
}

function hashValue(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "";
  return createHash("sha256").update(text).digest("hex");
}

function payloadKeys(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.keys(value as Record<string, unknown>).sort();
}

async function readInput(req: NextRequest): Promise<DryRunInput> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as DryRunInput;
  }

  const form = await req.formData().catch(() => null);
  if (!form) return {};

  return {
    action: asText(form.get("action")),
    target_id: asText(form.get("target_id")),
    reason: asText(form.get("reason")),
    requested_by: asText(form.get("requested_by")),
  };
}

async function auditDryRun(data: JsonObject) {
  const sb = createAdminSupabase();

  const { data: inserted, error } = await sb
    .from("events")
    .insert({
      project_id: "chido-casino",
      level: data.blocked === true ? "warn" : "info",
      type: "chido.action.dry_run",
      message: data.blocked === true
        ? `Intento bloqueado en Chido Actions: ${data.action_id}`
        : `Dry-run registrado para acción Chido: ${data.action_id}`,
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
  const actionId = asText(input.action);
  const targetId = asText(input.target_id);
  const reason = asText(input.reason);
  const requestedBy = asText(input.requested_by, "hocker-one");

  if (!actionId) {
    return NextResponse.json(
      {
        ok: false,
        dry_run: true,
        executed: false,
        trace_id: traceId,
        error: "Falta action.",
      },
      { status: 400 },
    );
  }

  if (isChidoBlockedAction(actionId)) {
    const blocked = getChidoBlockedAction(actionId);

    const eventId = await auditDryRun({
      trace_id: traceId,
      contract_version: CHIDO_ACTION_CONTRACT_VERSION,
      action_id: actionId,
      blocked: true,
      dry_run: true,
      executed: false,
      reason,
      requested_by: requestedBy,
      target_id_preview: preview(targetId),
      target_id_hash: hashValue(targetId),
      payload_keys: payloadKeys(input.payload),
      blocked_reason: blocked?.reason ?? "Acción bloqueada.",
      guardian_agis: [...(blocked?.guardianAgis ?? [])],
    } as JsonObject);

    return NextResponse.json(
      {
        ok: false,
        dry_run: true,
        executed: false,
        blocked: true,
        trace_id: traceId,
        event_id: eventId,
        action_id: actionId,
        reason: blocked?.reason ?? "Acción bloqueada.",
      },
      { status: 403 },
    );
  }

  const contract = getChidoActionContract(actionId);

  if (!contract) {
    return NextResponse.json(
      {
        ok: false,
        dry_run: true,
        executed: false,
        trace_id: traceId,
        error: `Acción no permitida: ${actionId}`,
      },
      { status: 400 },
    );
  }

  const eventId = await auditDryRun({
    trace_id: traceId,
    contract_version: CHIDO_ACTION_CONTRACT_VERSION,
    action_id: contract.id,
    action_label: contract.label,
    risk_level: contract.riskLevel,
    guardian_agis: contract.guardianAgis,
    required_before_real_execution: contract.requiredBeforeRealExecution,
    dry_run: true,
    executed: false,
    real_execution_enabled: false,
    sensitive: contract.sensitive,
    requested_by: requestedBy,
    reason,
    target_id_preview: preview(targetId),
    target_id_hash: hashValue(targetId),
    payload_keys: payloadKeys(input.payload),
    mode: "read_only_dry_run",
    hard_block: "No real action is executed by this endpoint.",
  } as JsonObject);

  return NextResponse.json({
    ok: true,
    dry_run: true,
    executed: false,
    trace_id: traceId,
    event_id: eventId,
    contract_version: CHIDO_ACTION_CONTRACT_VERSION,
    action: contract,
    message: "Dry-run registrado. No se ejecutó ninguna acción real.",
  });
}
