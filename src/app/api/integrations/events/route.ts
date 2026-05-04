import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  HOCKER_INTEGRATION_EVENTS,
  HOCKER_INTEGRATION_REGISTRY_VERSION,
  getCanonicalIntegration,
} from "@/lib/hocker-integrations";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

type EventInput = {
  module_id?: string;
  level?: "info" | "warn" | "error";
  event_type?: string;
  message?: string;
  data?: JsonObject;
  emitted_by?: string;
};

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

async function readInput(req: NextRequest): Promise<EventInput> {
  return (await req.json().catch(() => ({}))) as EventInput;
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const input = await readInput(req);

  const moduleId = asText(input.module_id);
  const integration = getCanonicalIntegration(moduleId);

  if (!integration) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      error: `Integración no registrada como canónica: ${moduleId}`,
    }, { status: 404 });
  }

  const eventType = asText(input.event_type, "custom");
  const message = asText(input.message, `Evento recibido desde ${integration.name}`);
  const level = input.level === "warn" || input.level === "error" ? input.level : "info";

  const payload = {
    trace_id: traceId,
    module_id: integration.module_id,
    module_name: integration.name,
    event_type: eventType,
    emitted_by: asText(input.emitted_by, integration.module_id),
    data: asRecord(input.data),
    registry_version: HOCKER_INTEGRATION_REGISTRY_VERSION,
    real_execution_enabled: false,
    execution_lock: true,
  } as JsonObject;

  const sb = createAdminSupabase();

  const { data: inserted, error } = await sb
    .from("events")
    .insert({
      project_id: "hocker-one",
      level,
      type: HOCKER_INTEGRATION_EVENTS.event,
      message,
      data: payload,
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
    message: "Evento de integración registrado.",
  });
}
