import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  HOCKER_SECURITY_EVENTS,
  evaluateSecurityReadiness,
} from "@/lib/hocker-client-portals";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const emitEvent = url.searchParams.get("emit_event") !== "0";

  const result = evaluateSecurityReadiness();

  if (emitEvent) {
    try {
      const sb = createAdminSupabase();

      const { data } = await sb
        .from("events")
        .insert({
          project_id: "hocker-one",
          level: result.ok ? "info" : "error",
          type: HOCKER_SECURITY_EVENTS.readiness,
          message: `Security readiness ejecutado: ${result.status}`,
          data: result as unknown as JsonObject,
        })
        .select("id")
        .single();

      return NextResponse.json({
        ...result,
        event_id: data?.id,
      });
    } catch {
      return NextResponse.json(result);
    }
  }

  return NextResponse.json(result);
}
