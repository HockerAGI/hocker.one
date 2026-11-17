import { existsSync } from "node:fs";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requirePrivateReadApi } from "@/lib/private-session-api-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = {
  active: boolean;
  label: string;
  detail: string;
  /** Only the serverless control-plane core may be required. */
  required?: boolean;
};

type NodePresence = {
  id?: string;
  project_id?: string;
  status?: string;
  last_seen_at?: string;
  updated_at?: string;
};

function env(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

function cleanUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function secondsSince(value?: string): number | null {
  if (!value) return null;

  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;

  return Math.max(0, Math.floor((Date.now() - time) / 1000));
}

async function probe(url: string, headers?: HeadersInit): Promise<boolean> {
  if (!url) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers,
      signal: controller.signal,
    });

    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function checkSupabase(): Promise<Check> {
  const url = env("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const publicKey = env(
    "SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );

  if (!url || !publicKey) {
    return {
      active: false,
      label: "Supabase",
      detail: "Sin variables",
    };
  }

  const active = await probe(`${cleanUrl(url)}/rest/v1/`, {
    apikey: publicKey,
    authorization: `Bearer ${publicKey}`,
  });

  return {
    active,
    label: "Supabase",
    detail: active ? "Online" : "Sin respuesta",
  };
}

// NOVA dedicated readiness is not proven by a reachable URL or a 401/403/404.
// The dedicated runtime contract requires its own fresh heartbeat and worker tick.
function novaReadyUrl(configured: string): string {
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    url.pathname = url.pathname
      .replace(/\/(?:api\/)?health(?:\/ready)?\/?$/, "")
      .replace(/\/+$/, "") + "/health/ready";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

async function probeNovaReady(url: string, headers: HeadersInit): Promise<boolean> {
  if (!url) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { ...headers, accept: "application/json" },
      signal: controller.signal,
    });
    if (response.status !== 200) return false;
    const payload: unknown = await response.json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
    const data = payload as Record<string, unknown>;
    if (data.ok !== true || data.status !== "ready" || data.service !== "nova.agi") return false;
    const checks = data.checks;
    if (!checks || typeof checks !== "object" || Array.isArray(checks)) return false;
    const proof = checks as Record<string, unknown>;
    const hasPassed = (name: string) => {
      const row = proof[name];
      return row && typeof row === "object" && !Array.isArray(row) &&
        (row as Record<string, unknown>).ok === true;
    };
    return Boolean(hasPassed("database") && hasPassed("inference_configuration") &&
      hasPassed("worker") && hasPassed("heartbeat"));
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function checkNova(): Promise<Check> {
  const url = env("NOVA_AGI_URL", "NOVA_URL", "NOVA_AGI_HEALTH_URL", "NOVA_HEALTH_URL");
  const key = env("NOVA_ORCHESTRATOR_KEY", "NOVA_API_KEY");

  if (!url) {
    return {
      active: false,
      label: "NOVA",
      detail: "Sin endpoint",
    };
  }

  const headers: HeadersInit = key ? { authorization: `Bearer ${key}` } : {};
  const active = await probeNovaReady(novaReadyUrl(url), headers);

  return {
    active,
    label: "NOVA",
    detail: active ? "Runtime dedicado listo" : "Readiness no verificada",
  };
}

// A reachable /health page, a 401, or a 404 cannot establish that the
// physical command executor is alive and able to process authorized work.
function nodeReadyUrl(configured: string): string {
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    url.pathname = url.pathname
      .replace(/\/(?:health|ready)\/?$/, "")
      .replace(/\/+$/, "") + "/ready";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

async function probeNodeReady(url: string): Promise<boolean> {
  if (!url) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (response.status !== 200) return false;
    const payload: unknown = await response.json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
    const state = payload as Record<string, unknown>;
    return state.ok === true && state.status === "ready" &&
      state.heartbeat_fresh === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function checkAgentByUrl(): Promise<Check> {
  const configured = env("HOCKER_NODE_AGENT_HEALTH_URL", "HOCKER_NODE_AGENT_URL");
  if (!configured) {
    // A fresh presence record alone cannot prove /ready; never bypass
    // the joint live-readiness requirement through missing configuration.
    return { active: false, label: "Agente", detail: "Sin endpoint /ready configurado" };
  }

  const remoteReady = await probeNodeReady(nodeReadyUrl(configured));
  if (!remoteReady) {
    return { active: false, label: "Agente", detail: "Readiness no verificada" };
  }

  // The remote HTTP endpoint cannot prove its own node/project identity.
  // Require an independent, fresh, persisted heartbeat for this exact node.
  const persisted = await checkAgentBySupabase();
  return {
    active: persisted.active,
    label: "Agente",
    detail: persisted.active
      ? "Runtime /ready y heartbeat verificados"
      : `/ready OK; ${persisted.detail}`,
  };
}

async function checkAgentBySupabase(): Promise<Check> {
  const supabaseUrl = env("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");
  const projectId = env("HOCKER_PROJECT_ID", "NEXT_PUBLIC_HOCKER_PROJECT_ID") || "hocker-one";
  const nodeId = env("HOCKER_LOCAL_AGENT_NODE_ID", "HOCKER_NODE_AGENT_ID", "HOCKER_DEFAULT_NODE_ID", "DEFAULT_COMMAND_NODE_ID") || "hocker-node-1";

  if (!supabaseUrl || !serviceKey) {
    return {
      active: false,
      label: "Agente",
      detail: "Sin Supabase server key",
    };
  }

  const query = new URLSearchParams({
    id: `eq.${nodeId}`,
    project_id: `eq.${projectId}`,
    select: "id,project_id,status,last_seen_at,updated_at",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(`${cleanUrl(supabaseUrl)}/rest/v1/nodes?${query.toString()}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        active: false,
        label: "Agente",
        detail: "Supabase sin respuesta",
      };
    }

    const rows = (await res.json()) as NodePresence[];
    const node = rows[0];

    if (!node) {
      return {
        active: false,
        label: "Agente",
        detail: "Sin registro",
      };
    }

    const age = secondsSince(node.last_seen_at);
    const fresh = age !== null && age <= 120;
    const online = node.status === "online";

    return {
      active: Boolean(fresh && online),
      label: "Agente",
      detail: fresh && online ? "Online" : `Última señal hace ${age ?? "?"}s`,
    };
  } catch {
    return {
      active: false,
      label: "Agente",
      detail: "Sin respuesta",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function checkAgent(): Promise<Check> {
  return checkAgentByUrl();
}

async function checkPwa(request: Request): Promise<Check> {
  const origin = new URL(request.url).origin;

  const manifestActive = await probe(`${origin}/manifest.webmanifest`);
  const swActive = await probe(`${origin}/sw.js`);

  if (manifestActive && swActive) {
    return {
      active: true,
      label: "PWA",
      detail: "Lista",
    };
  }

  if (manifestActive) {
    return {
      active: true,
      label: "PWA",
      detail: "Manifest activo",
    };
  }

  return {
    active: false,
    label: "PWA",
    detail: "Sin manifest",
  };
}

function fileExists(...parts: string[]): boolean {
  return existsSync(join(process.cwd(), ...parts));
}

export async function GET(request: NextRequest) {
  const privateAccess = await requirePrivateReadApi(request);
  if (!privateAccess.ok) return privateAccess.response;

  const vercelActive = Boolean(env("VERCEL", "VERCEL_ENV", "VERCEL_URL"));

  const androidShellReady =
    fileExists("android", "app", "src", "main", "AndroidManifest.xml") ||
    env("ANDROID_APP_READY", "NEXT_PUBLIC_ANDROID_APP_READY") === "1";

  const [supabase, nova, agent, pwa] = await Promise.all([
    checkSupabase(),
    checkNova(),
    checkAgent(),
    checkPwa(request),
  ]);

  return NextResponse.json(
    {
      ok: true,
      service: "hocker.one",
      timestamp: new Date().toISOString(),
      access: {
        actor: privateAccess.actor,
        authentication: privateAccess.authentication,
        gate_version: privateAccess.version,
      },
      runtime: {
        node: process.version,
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      },
      health_scope: "hocker_one_serverless_core",
      // Dedicated NOVA and local/physical Node Agent are expansion features.
      // They remain visibly unverified but cannot mark the primary cloud
      // control plane down when absent.
      checks: {
        web: {
          active: true,
          label: "Web",
          detail: "Online",
          required: true,
        },
        vercel: {
          active: vercelActive,
          label: "Vercel",
          detail: vercelActive ? "Activo" : "Local",
          required: true,
        },
        supabase: { ...supabase, required: true },
        nova: { ...nova, label: "NOVA dedicada", required: false },
        agent: { ...agent, label: "Node Agent físico", required: false },
        pwa: { ...pwa, required: false },
        android: {
          active: androidShellReady,
          label: "Android",
          detail: androidShellReady ? "Shell listo" : "No detectado",
          required: false,
        },
        api: {
          active: true,
          label: "API",
          detail: "Online",
          required: true,
        },
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
