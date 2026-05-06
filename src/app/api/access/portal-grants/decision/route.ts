import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { getHockerClientPortal } from "@/lib/hocker-client-portals";
import {
  HOCKER_ACCESS_GRANT_EVENTS,
  asRecord,
  asStringArray,
  asText,
  buildGrantAuditBase,
  validateOwnerActionKey,
  type HockerGrantDecision,
} from "@/lib/hocker-access-grants";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

type Input = {
  request_event_id?: string;
  decision?: HockerGrantDecision;
  decided_by?: string;
  reason?: string;
};

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const gate = validateOwnerActionKey(req);

  if (!gate.ok) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        executed: false,
        reason: gate.reason,
        message: "Owner gate rechazó la decisión de acceso.",
      },
      { status: 401 },
    );
  }

  const input = (await req.json().catch(() => ({}))) as Input;
  const requestEventId = asText(input.request_event_id);
  const decision = input.decision === "rejected" ? "rejected" : "approved";
  const decidedBy = asText(input.decided_by, "hocker-owner");
  const reason = asText(input.reason, "Owner decision.");

  if (!requestEventId) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        executed: false,
        reason: "request_event_id_required",
      },
      { status: 400 },
    );
  }

  const sb = createAdminSupabase();

  const { data: requestEvent, error: requestError } = await sb
    .from("events")
    .select("id,type,message,created_at,data")
    .eq("project_id", "hocker-one")
    .eq("id", requestEventId)
    .maybeSingle();

  if (requestError || !requestEvent) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        executed: false,
        reason: "grant_request_not_found",
      },
      { status: 404 },
    );
  }

  if (requestEvent.type !== HOCKER_ACCESS_GRANT_EVENTS.request) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        executed: false,
        reason: "event_is_not_portal_grant_request",
        event_type: requestEvent.type,
      },
      { status: 409 },
    );
  }

  const requestData = asRecord(requestEvent.data);
  const portalId = asText(requestData.portal_id);
  const portal = getHockerClientPortal(portalId);

  if (!portal) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        executed: false,
        reason: "portal_not_found",
        portal_id: portalId,
      },
      { status: 404 },
    );
  }

  const blockedRequestedPermissions = asStringArray(requestData.blocked_requested_permissions);
  const allowedRequestedPermissions = asStringArray(requestData.allowed_requested_permissions);

  if (decision === "approved" && blockedRequestedPermissions.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        executed: false,
        reason: "blocked_permissions_cannot_be_approved",
        blocked_requested_permissions: blockedRequestedPermissions,
      },
      { status: 409 },
    );
  }

  const grantId = decision === "approved" ? randomUUID() : null;

  const auditData = {
    ...buildGrantAuditBase({
      trace_id: traceId,
      requested_by: decidedBy,
      reason,
    }),
    owner_gate: gate.owner_gate,
    owner_gate_reason: gate.reason,
    request_event_id: requestEventId,
    decision,
    status: decision === "approved" ? "approved_logical_grant" : "rejected",
    grant_id: grantId,
    portal_id: portal.portal_id,
    portal_name: portal.name,
    grantee_email: asText(requestData.grantee_email, "pending@example.com"),
    access_type: asText(requestData.access_type, "temporary"),
    expires_at: requestData.expires_at ?? null,
    permissions: allowedRequestedPermissions,
    modules: asStringArray(requestData.requested_modules),
    blocked_requested_permissions: blockedRequestedPermissions,
    controlled_by: "hocker-one",
    note: "Logical grant only. No real auth session was created.",
  } as JsonObject;

  const { data: inserted, error: insertError } = await sb
    .from("events")
    .insert({
      project_id: "hocker-one",
      level: decision === "approved" ? "info" : "warn",
      type: HOCKER_ACCESS_GRANT_EVENTS.decision,
      message:
        decision === "approved"
          ? `Portal grant approved: ${portal.portal_id}`
          : `Portal grant rejected: ${portal.portal_id}`,
      data: auditData,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        executed: false,
        reason: "failed_to_insert_grant_decision",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    dry_run: true,
    executed: false,
    creates_real_session: false,
    event_id: inserted?.id,
    trace_id: traceId,
    request_event_id: requestEventId,
    decision,
    status: auditData.status,
    grant_id: grantId,
    portal_id: portal.portal_id,
    permissions: allowedRequestedPermissions,
    message:
      decision === "approved"
        ? "Grant lógico aprobado y auditado. No se creó sesión real todavía."
        : "Grant rechazado y auditado.",
  });
}
