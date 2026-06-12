import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { randomUUID } from "crypto";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  HOCKER_INTEGRATION_EVENTS,
  HOCKER_INTEGRATION_REGISTRY_VERSION,
  getCanonicalIntegration,
  normalizeIntegrationStatus,
} from "@/lib/hocker-integrations";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

async function checkHealth(endpoint: string) {
  const started = Date.now();

  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        "User-Agent": "HockerONE-IntegrationRegistry/0.1",
      },
    });

    const raw = await res.text();
    let json: unknown = null;

    try {
      json = JSON.parse(raw);
    } catch {
      json = { raw: raw.slice(0, 500) };
    }

    return {
      ok: res.ok,
      http_status: res.status,
      latency_ms: Date.now() - started,
      body: json,
    };
  } catch (error) {
    return {
      ok: false,
      http_status: 0,
      latency_ms: Date.now() - started,
      body: {
        error: error instanceof Error ? error.message : "unknown_error",
      },
    };
  }
}

export async function GET(req: NextRequest) {
  const traceId = randomUUID();
  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
  if (ownerGateResponse) return ownerGateResponse;
  const url = new URL(req.url);
  const moduleId = asText(url.searchParams.get("module_id"), "chido-casino");
  const emitEvent = asText(url.searchParams.get("emit_event"), "1") !== "0";

  const integration = getCanonicalIntegration(moduleId);

  if (!integration) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      error: `Integración no encontrada: ${moduleId}`,
    }, { status: 404 });
  }

  const health = await checkHealth(integration.health_endpoint);
  const body = health.body && typeof health.body === "object" ? health.body as Record<string, unknown> : {};
  const remoteStatus = normalizeIntegrationStatus(body.status);
  const status = health.ok ? (remoteStatus === "unknown" ? "online" : remoteStatus) : "offline";

  const payload = {
    trace_id: traceId,
    module_id: integration.module_id,
    name: integration.name,
    status,
    ok: health.ok,
    http_status: health.http_status,
    latency_ms: health.latency_ms,
    health_endpoint: integration.health_endpoint,
    actions_mode: integration.actions_mode,
    real_execution_enabled: false,
    execution_lock: true,
    registry_version: HOCKER_INTEGRATION_REGISTRY_VERSION,
    remote: body,
  } as JsonObject;

  let eventId: string | undefined;

  if (emitEvent) {
    const sb = createAdminSupabase();

    const { data: inserted } = await sb
      .from("events")
      .insert({
        project_id: "hocker-one",
        level: health.ok ? "info" : "warn",
        type: HOCKER_INTEGRATION_EVENTS.healthCheck,
        message: `Health check de integración: ${integration.name} → ${status}`,
        data: payload,
      })
      .select("id")
      .single();

    eventId = inserted?.id;
  }

  return NextResponse.json({
    ok: health.ok,
    trace_id: traceId,
    event_id: eventId,
    module_id: integration.module_id,
    status,
    integration: {
      module_id: integration.module_id,
      name: integration.name,
      type: integration.type,
      dashboard_path: integration.dashboard_path,
      actions_mode: integration.actions_mode,
      real_execution_enabled: false,
      execution_lock: true,
      responsible_agis: integration.responsible_agis,
      capabilities: integration.capabilities,
    },
    health,
  });
}
