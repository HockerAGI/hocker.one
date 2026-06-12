import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  HOCKER_CLIENT_PORTAL_VERSION,
  HOCKER_ONE_OWNER_ONLY,
  HOCKER_SECURITY_EVENTS,
  getHockerClientPortal,
} from "@/lib/hocker-client-portals";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

type Input = {
  portal_id?: string;
  grantee_email?: string;
  access_type?: "temporary" | "permanent";
  expires_at?: string | null;
  permissions?: string[];
  modules?: string[];
  requested_by?: string;
  reason?: string;
};

function cleanText(value: unknown, fallback = ""): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function cleanArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
  if (ownerGateResponse) return ownerGateResponse;
  const input = (await req.json().catch(() => ({}))) as Input;

  const portalId = cleanText(input.portal_id);
  const portal = getHockerClientPortal(portalId);

  if (!portal) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        reason: "portal_not_found",
        portal_id: portalId || null,
      },
      { status: 404 },
    );
  }

  const accessType = input.access_type === "permanent" ? "permanent" : "temporary";
  const permissions = cleanArray(input.permissions);
  const modules = cleanArray(input.modules);

  const blockedRequestedPermissions = permissions.filter((permission) =>
    portal.blocked_permissions.includes(permission),
  );

  const allowedRequestedPermissions = permissions.filter((permission) =>
    portal.allowed_permissions.includes(permission),
  );

  const grantRequest = {
    trace_id: traceId,
    portal_id: portal.portal_id,
    portal_name: portal.name,
    grantee_email: cleanText(input.grantee_email, "pending@example.com"),
    access_type: accessType,
    expires_at: accessType === "temporary" ? (input.expires_at ?? null) : null,
    requested_permissions: permissions,
    allowed_requested_permissions: allowedRequestedPermissions,
    blocked_requested_permissions: blockedRequestedPermissions,
    requested_modules: modules,
    requested_by: cleanText(input.requested_by, "hocker-one"),
    reason: cleanText(input.reason, "Solicitud de acceso a portal derivado."),
    status: blockedRequestedPermissions.length > 0 ? "needs_review" : "pending_owner_approval",
    owner_only_core: HOCKER_ONE_OWNER_ONLY,
    real_execution_enabled: false,
    execution_lock: true,
    version: HOCKER_CLIENT_PORTAL_VERSION,
  } as JsonObject;

  let eventId: string | undefined;

  try {
    const sb = createAdminSupabase();

    const { data } = await sb
      .from("events")
      .insert({
        project_id: "hocker-one",
        level: blockedRequestedPermissions.length > 0 ? "warn" : "info",
        type: HOCKER_SECURITY_EVENTS.portalGrantRequest,
        message: `Portal grant request: ${portal.portal_id}`,
        data: grantRequest,
      })
      .select("id")
      .single();

    eventId = data?.id;
  } catch {
    eventId = undefined;
  }

  return NextResponse.json({
    ok: true,
    executed: false,
    dry_run: true,
    event_id: eventId,
    trace_id: traceId,
    portal_id: portal.portal_id,
    access_type: accessType,
    status: grantRequest.status,
    blocked_requested_permissions: blockedRequestedPermissions,
    allowed_requested_permissions: allowedRequestedPermissions,
    message: "Solicitud registrada. No se creó acceso real todavía; requiere aprobación del owner desde Hocker ONE.",
  });
}
