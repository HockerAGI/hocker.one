import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  HOCKER_ACCESS_EVENTS,
  HOCKER_ACCESS_POLICY_VERSION,
  HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
  checkHockerPermission,
  getDefaultHockerRole,
  normalizeHockerRole,
  normalizePermission,
} from "@/lib/hocker-roles";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

type AccessCheckInput = {
  role?: string;
  permission?: string;
  module_id?: string;
  action_id?: string;
  requested_by?: string;
};

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

async function readInput(req: NextRequest): Promise<AccessCheckInput> {
  return (await req.json().catch(() => ({}))) as AccessCheckInput;
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const input = await readInput(req);

  const role = normalizeHockerRole(input.role || req.headers.get("x-hocker-role") || getDefaultHockerRole());
  const permission = normalizePermission(input.permission);

  if (!permission) {
    return NextResponse.json({
      ok: false,
      allowed: false,
      trace_id: traceId,
      role,
      permission: input.permission ?? null,
      reason: "invalid_permission",
      execution_lock: HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
      real_execution_enabled: false,
    }, { status: 400 });
  }

  const result = checkHockerPermission({
    role,
    permission,
    module_id: asText(input.module_id, "hocker-one"),
    action_id: asText(input.action_id),
  });

  const auditData = {
    trace_id: traceId,
    role,
    permission,
    module_id: asText(input.module_id, "hocker-one"),
    action_id: asText(input.action_id),
    requested_by: asText(input.requested_by, "hocker-one"),
    allowed: result.allowed,
    reason: result.reason,
    policy_version: HOCKER_ACCESS_POLICY_VERSION,
    execution_lock: result.execution_lock,
    real_execution_enabled: result.real_execution_enabled,
  } as JsonObject;

  let eventId: string | undefined;

  try {
    const sb = createAdminSupabase();

    const { data } = await sb
      .from("events")
      .insert({
        project_id: "hocker-one",
        level: result.allowed ? "info" : "warn",
        type: HOCKER_ACCESS_EVENTS.check,
        message: result.allowed
          ? `Access granted: ${role} → ${permission}`
          : `Access denied: ${role} → ${permission}`,
        data: auditData,
      })
      .select("id")
      .single();

    eventId = data?.id;
  } catch {
    eventId = undefined;
  }

  return NextResponse.json({
    ok: true,
    allowed: result.allowed,
    trace_id: traceId,
    event_id: eventId,
    role,
    permission,
    reason: result.reason,
    execution_lock: result.execution_lock,
    real_execution_enabled: result.real_execution_enabled,
    message: result.allowed
      ? "Permiso concedido por policy. No implica ejecución real."
      : "Permiso denegado por policy.",
  });
}
