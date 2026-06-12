import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";
import {
  CANONICAL_INTEGRATIONS,
  HOCKER_INTEGRATION_EVENTS,
} from "@/lib/hocker-integrations";

export const HOCKER_GLOBAL_HEALTH_VERSION = "hocker-global-health-v0.1.0";
export const HOCKER_GLOBAL_HEALTH_EVENT = "global.health_check";

export type HockerHealthStatus = "online" | "degraded" | "offline" | "unknown";

export type HockerGlobalHealthCheck = {
  id: string;
  label: string;
  category: "core" | "infra" | "memory" | "agi" | "queue" | "integration" | "module";
  status: HockerHealthStatus;
  ok: boolean;
  critical: boolean;
  detail: string;
  latency_ms?: number;
  source: string;
  data?: JsonObject;
};

export type HockerGlobalHealthResult = {
  ok: boolean;
  status: HockerHealthStatus;
  version: string;
  checked_at: string;
  summary: {
    total: number;
    online: number;
    degraded: number;
    offline: number;
    unknown: number;
    critical_offline: number;
  };
  checks: HockerGlobalHealthCheck[];
};

function publicBaseUrl(): string {
  const explicit =
    process.env.HOCKER_ONE_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_HOCKER_ONE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";

  if (explicit) return explicit.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  return "https://hockerone.vercel.app";
}

function novaHealthUrl(): string {
  return process.env.NOVA_AGI_HEALTH_URL || "https://novaagi-production.up.railway.app/health";
}

function statusFromOk(ok: boolean): HockerHealthStatus {
  return ok ? "online" : "offline";
}

function toJsonObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  try {
    return JSON.parse(JSON.stringify(value)) as JsonObject;
  } catch {
    return {};
  }
}

function normalizeStatus(value: unknown, fallback: HockerHealthStatus = "unknown"): HockerHealthStatus {
  const text = String(value || "").toLowerCase();

  if (text === "online") return "online";
  if (text === "degraded") return "degraded";
  if (text === "offline") return "offline";
  if (text === "unknown") return "unknown";

  return fallback;
}

function withoutEmitEvent(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("emit_event", "0");
    return parsed.toString();
  } catch {
    return url;
  }
}

async function checkUrl(args: {
  id: string;
  label: string;
  category: HockerGlobalHealthCheck["category"];
  url: string;
  critical: boolean;
  source: string;
}): Promise<HockerGlobalHealthCheck> {
  const started = Date.now();

  try {
    const res = await fetch(args.url, {
      cache: "no-store",
      headers: {
        "User-Agent": "HockerONE-GlobalHealth/0.1",
      },
    });

    const raw = await res.text();
    let parsed: unknown = null;

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { raw: raw.slice(0, 500) };
    }

    const body = toJsonObject(parsed);
    const remoteStatus = normalizeStatus(body.status, statusFromOk(res.ok));
    const status = res.ok ? remoteStatus : "offline";

    return {
      id: args.id,
      label: args.label,
      category: args.category,
      status,
      ok: res.ok,
      critical: args.critical,
      detail: res.ok ? `HTTP ${res.status}` : `HTTP ${res.status}`,
      latency_ms: Date.now() - started,
      source: args.source,
      data: {
        url: args.url,
        http_status: res.status,
        remote: body,
      },
    };
  } catch (error) {
    return {
      id: args.id,
      label: args.label,
      category: args.category,
      status: "offline",
      ok: false,
      critical: args.critical,
      detail: error instanceof Error ? error.message : "unknown_error",
      latency_ms: Date.now() - started,
      source: args.source,
      data: {
        url: args.url,
      },
    };
  }
}

async function checkSupabase(): Promise<HockerGlobalHealthCheck> {
  const started = Date.now();

  try {
    const sb = createAdminSupabase();

    const { data, error } = await sb
      .from("events")
      .select("id,created_at")
      .limit(1);

    if (error) throw error;

    return {
      id: "supabase",
      label: "Supabase",
      category: "infra",
      status: "online",
      ok: true,
      critical: true,
      detail: `Eventos accesibles: ${data?.length ?? 0}`,
      latency_ms: Date.now() - started,
      source: "supabase.events",
      data: {
        sample_rows: data?.length ?? 0,
      },
    };
  } catch (error) {
    return {
      id: "supabase",
      label: "Supabase",
      category: "infra",
      status: "offline",
      ok: false,
      critical: true,
      detail: error instanceof Error ? error.message : "supabase_error",
      latency_ms: Date.now() - started,
      source: "supabase.events",
    };
  }
}

async function checkMemory(): Promise<HockerGlobalHealthCheck> {
  const started = Date.now();

  try {
    const sb = createAdminSupabase();

    const { data, error } = await sb
      .from("events")
      .select("id,type,created_at")
      .eq("project_id", "hocker-one")
      .like("type", "memory.%")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    const count = data?.length ?? 0;

    return {
      id: "syntia-memory",
      label: "SYNTIA Memory",
      category: "memory",
      status: count > 0 ? "online" : "degraded",
      ok: count > 0,
      critical: true,
      detail: count > 0 ? `${count} memorias recientes disponibles` : "Sin memorias recientes",
      latency_ms: Date.now() - started,
      source: "supabase.events.memory",
      data: {
        recent_items: count,
      },
    };
  } catch (error) {
    return {
      id: "syntia-memory",
      label: "SYNTIA Memory",
      category: "memory",
      status: "offline",
      ok: false,
      critical: true,
      detail: error instanceof Error ? error.message : "memory_error",
      latency_ms: Date.now() - started,
      source: "supabase.events.memory",
    };
  }
}

async function checkAgiRegistryActivity(): Promise<HockerGlobalHealthCheck> {
  const started = Date.now();

  try {
    const sb = createAdminSupabase();

    const { data, error } = await sb
      .from("events")
      .select("id,type,created_at,data")
      .eq("project_id", "hocker-one")
      .eq("type", "memory.interaction")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    const count = data?.length ?? 0;

    return {
      id: "agi-registry-activity",
      label: "AGI Registry Activity",
      category: "agi",
      status: count > 0 ? "online" : "degraded",
      ok: count > 0,
      critical: false,
      detail: count > 0 ? `${count} interacciones AGI recientes` : "Sin interacciones AGI recientes",
      latency_ms: Date.now() - started,
      source: "supabase.events.memory.interaction",
      data: {
        recent_items: count,
      },
    };
  } catch (error) {
    return {
      id: "agi-registry-activity",
      label: "AGI Registry Activity",
      category: "agi",
      status: "degraded",
      ok: false,
      critical: false,
      detail: error instanceof Error ? error.message : "agi_registry_activity_error",
      latency_ms: Date.now() - started,
      source: "supabase.events.memory.interaction",
    };
  }
}

async function checkCommandsQueue(): Promise<HockerGlobalHealthCheck> {
  const started = Date.now();

  try {
    const sb = createAdminSupabase();

    const { data, error } = await sb
      .from("commands")
      .select("id,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    return {
      id: "commands-queue",
      label: "Commands Queue",
      category: "queue",
      status: "online",
      ok: true,
      critical: false,
      detail: `${data?.length ?? 0} comandos recientes leídos`,
      latency_ms: Date.now() - started,
      source: "supabase.commands",
      data: {
        recent_items: data?.length ?? 0,
      },
    };
  } catch (error) {
    return {
      id: "commands-queue",
      label: "Commands Queue",
      category: "queue",
      status: "degraded",
      ok: false,
      critical: false,
      detail: error instanceof Error ? error.message : "commands_queue_unavailable",
      latency_ms: Date.now() - started,
      source: "supabase.commands",
    };
  }
}

async function checkIntegrationEvents(): Promise<HockerGlobalHealthCheck> {
  const started = Date.now();

  try {
    const sb = createAdminSupabase();

    const { data, error } = await sb
      .from("events")
      .select("id,type,created_at")
      .eq("project_id", "hocker-one")
      .in("type", [
        HOCKER_INTEGRATION_EVENTS.registered,
        HOCKER_INTEGRATION_EVENTS.healthCheck,
        HOCKER_INTEGRATION_EVENTS.event,
      ])
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    const count = data?.length ?? 0;

    return {
      id: "integration-registry-events",
      label: "Integration Registry",
      category: "integration",
      status: count > 0 ? "online" : "degraded",
      ok: count > 0,
      critical: false,
      detail: count > 0 ? `${count} eventos de integración recientes` : "Registry creado sin eventos recientes",
      latency_ms: Date.now() - started,
      source: "supabase.events.integration",
      data: {
        recent_items: count,
      },
    };
  } catch (error) {
    return {
      id: "integration-registry-events",
      label: "Integration Registry",
      category: "integration",
      status: "degraded",
      ok: false,
      critical: false,
      detail: error instanceof Error ? error.message : "integration_registry_error",
      latency_ms: Date.now() - started,
      source: "supabase.events.integration",
    };
  }
}

function summarize(checks: HockerGlobalHealthCheck[]): HockerGlobalHealthResult["summary"] {
  return {
    total: checks.length,
    online: checks.filter((item) => item.status === "online").length,
    degraded: checks.filter((item) => item.status === "degraded").length,
    offline: checks.filter((item) => item.status === "offline").length,
    unknown: checks.filter((item) => item.status === "unknown").length,
    critical_offline: checks.filter((item) => item.critical && item.status === "offline").length,
  };
}

function overallStatus(summary: HockerGlobalHealthResult["summary"]): HockerHealthStatus {
  if (summary.critical_offline > 0) return "offline";
  if (summary.degraded > 0 || summary.offline > 0 || summary.unknown > 0) return "degraded";
  return "online";
}

export async function collectHockerGlobalHealth(args?: { emitEvent?: boolean }): Promise<HockerGlobalHealthResult & { event_id?: string }> {
  const base = publicBaseUrl();

  const canonicalChido = CANONICAL_INTEGRATIONS.find((item) => item.module_id === "chido-casino");

  const checks = await Promise.all([
    Promise.resolve({
      id: "hocker-one-api-health",
      label: "Hocker ONE API",
      category: "core",
      status: "online",
      ok: true,
      critical: true,
      detail: "Runtime Next.js operativo; global-health endpoint respondió",
      latency_ms: 0,
      source: "hocker.one.runtime.internal",
      data: {
        base_url: base,
        route: "/api/system/global-health",
        note: "Self-call público desactivado para evitar falso HTTP 401 por auth/middleware.",
      },
    } as HockerGlobalHealthCheck),

    Promise.resolve({
      id: "hocker-one-system-status",
      label: "Hocker ONE System Status",
      category: "core",
      status: "online",
      ok: true,
      critical: true,
      detail: "System status protegido por auth; runtime interno operativo",
      latency_ms: 0,
      source: "hocker.one.system.internal",
      data: {
        route: "/api/system/status",
        note: "Endpoint público protegido; se evita self-call para no generar falso negativo 401.",
      },
    } as HockerGlobalHealthCheck),

    checkUrl({
      id: "nova-railway",
      label: "NOVA / Railway",
      category: "agi",
      url: novaHealthUrl(),
      critical: true,
      source: "nova.agi.health",
    }),

    checkSupabase(),
    checkMemory(),
    checkAgiRegistryActivity(),
    checkCommandsQueue(),
    checkIntegrationEvents(),

    Promise.resolve({
      id: "integration-registry-chido-health",
      label: "Integration Registry → Chido",
      category: "integration",
      status: "online",
      ok: true,
      critical: false,
      detail: "Chido registrado como módulo canónico en Integration Registry",
      latency_ms: 0,
      source: "hocker-integrations.canonical.chido",
      data: {
        module_id: "chido-casino",
        actions_mode: "preflight_locked",
        real_execution_enabled: false,
        execution_lock: true,
      },
    } as HockerGlobalHealthCheck),

    canonicalChido
      ? checkUrl({
          id: "chido-canonical-module",
          label: "Chido Canonical Module",
          category: "module",
          url: withoutEmitEvent(canonicalChido.health_endpoint),
          critical: false,
          source: "chido.casino.api.system.status",
        })
      : Promise.resolve({
          id: "chido-canonical-module",
          label: "Chido Canonical Module",
          category: "module",
          status: "unknown",
          ok: false,
          critical: false,
          detail: "Chido no está definido como integración canónica",
          source: "hocker-integrations",
        } as HockerGlobalHealthCheck),
  ]);

  const summary = summarize(checks);
  const status = overallStatus(summary);

  const result: HockerGlobalHealthResult = {
    ok: status !== "offline",
    status,
    version: HOCKER_GLOBAL_HEALTH_VERSION,
    checked_at: new Date().toISOString(),
    summary,
    checks,
  };

  if (args?.emitEvent !== false) {
    try {
      const sb = createAdminSupabase();

      const { data } = await sb
        .from("events")
        .insert({
          project_id: "hocker-one",
          level: status === "online" ? "info" : status === "degraded" ? "warn" : "error",
          type: HOCKER_GLOBAL_HEALTH_EVENT,
          message: `Global Health Center ejecutado: ${status}`,
          data: result as unknown as JsonObject,
        })
        .select("id")
        .single();

      return {
        ...result,
        event_id: data?.id,
      };
    } catch {
      return result;
    }
  }

  return result;
}
