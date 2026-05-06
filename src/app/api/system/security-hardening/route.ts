import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  evaluateHockerSecurityHardening,
  HOCKER_SECURITY_HARDENING_EVENT,
} from "@/lib/hocker-security-hardening";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const emitEvent = url.searchParams.get("emit_event") !== "0";

  const result = evaluateHockerSecurityHardening();
  let eventId: string | undefined;

  if (emitEvent) {
    try {
      const sb = createAdminSupabase();

      const { data } = await sb
        .from("events")
        .insert({
          project_id: "hocker-one",
          level: result.status === "blocked" ? "error" : result.status === "warning" ? "warn" : "info",
          type: HOCKER_SECURITY_HARDENING_EVENT,
          message: `Security hardening status: ${result.status}`,
          data: result as unknown as JsonObject,
        })
        .select("id")
        .single();

      eventId = data?.id;
    } catch {
      eventId = undefined;
    }
  }

  return NextResponse.json({
    ...result,
    event_id: eventId,
  });
}
