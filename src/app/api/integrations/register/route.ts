import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  CANONICAL_INTEGRATIONS,
  HOCKER_INTEGRATION_EVENTS,
  HOCKER_INTEGRATION_REGISTRY_VERSION,
  getCanonicalIntegration,
} from "@/lib/hocker-integrations";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

type RegisterInput = {
  module_id?: string;
  requested_by?: string;
};

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

async function readInput(req: NextRequest): Promise<RegisterInput> {
  return (await req.json().catch(() => ({}))) as RegisterInput;
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const input = await readInput(req);

  const moduleId = asText(input.module_id, "chido-casino");
  const requestedBy = asText(input.requested_by, "hocker-one");

  const integration = getCanonicalIntegration(moduleId);

  if (!integration) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      error: `Integración no canónica o no soportada todavía: ${moduleId}`,
      available_modules: CANONICAL_INTEGRATIONS.map((item) => item.module_id),
    }, { status: 404 });
  }

  const sb = createAdminSupabase();

  const data = {
    trace_id: traceId,
    requested_by: requestedBy,
    module_id: integration.module_id,
    integration,
    registry_version: HOCKER_INTEGRATION_REGISTRY_VERSION,
    real_execution_enabled: false,
    execution_lock: true,
  } as JsonObject;

  const { data: inserted, error } = await sb
    .from("events")
    .insert({
      project_id: "hocker-one",
      level: "info",
      type: HOCKER_INTEGRATION_EVENTS.registered,
      message: `Integración registrada en Hocker ONE: ${integration.name}`,
      data,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      error: error.message,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    trace_id: traceId,
    event_id: inserted?.id,
    module_id: integration.module_id,
    integration,
    message: "Integración canónica registrada. No se habilitó ejecución real.",
  });
}
