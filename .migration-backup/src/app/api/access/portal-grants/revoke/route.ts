import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  HOCKER_ACCESS_GRANT_EVENTS,
  asRecord,
  asText,
  buildGrantAuditBase,
  validateOwnerActionKey,
} from "@/lib/hocker-access-grants";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

type Input = {
  grant_id?: string;
  revoked_by?: string;
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
        message: "Owner gate rechazó la revocación de acceso.",
      },
      { status: 401 },
    );
  }

  const input = (await req.json().catch(() => ({}))) as Input;
  const grantId = asText(input.grant_id);
  const revokedBy = asText(input.revoked_by, "hocker-owner");
  const reason = asText(input.reason, "Owner revoke.");

  if (!grantId) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        executed: false,
        reason: "grant_id_required",
      },
      { status: 400 },
    );
  }

  const sb = createAdminSupabase();

  const { data: grantEvent } = await sb
    .from("events")
    .select("id,type,message,created_at,data")
    .eq("project_id", "hocker-one")
    .eq("type", HOCKER_ACCESS_GRANT_EVENTS.decision)
    .filter("data->>grant_id", "eq", grantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!grantEvent) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        executed: false,
        reason: "grant_not_found",
        grant_id: grantId,
      },
      { status: 404 },
    );
  }

  const grantData = asRecord(grantEvent.data);

  const auditData = {
    ...buildGrantAuditBase({
      trace_id: traceId,
      requested_by: revokedBy,
      reason,
    }),
    owner_gate: gate.owner_gate,
    owner_gate_reason: gate.reason,
    grant_id: grantId,
    previous_grant_event_id: grantEvent.id,
    portal_id: asText(grantData.portal_id),
    grantee_email: asText(grantData.grantee_email),
    status: "revoked",
    revoked_at: new Date().toISOString(),
    controlled_by: "hocker-one",
    note: "Logical revoke only. No real auth session existed.",
  } as JsonObject;

  const { data: inserted, error: insertError } = await sb
    .from("events")
    .insert({
      project_id: "hocker-one",
      level: "warn",
      type: HOCKER_ACCESS_GRANT_EVENTS.revoke,
      message: `Portal grant revoked: ${grantId}`,
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
        reason: "failed_to_insert_grant_revoke",
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
    grant_id: grantId,
    status: "revoked",
    message: "Grant lógico revocado y auditado. No existía sesión real.",
  });
}
