import { existsSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = {
  active: boolean;
  label: string;
  detail: string;
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

    return res.status > 0 && res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function checkSupabase(): Promise<Check> {
  const url = env("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const anon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");

  if (!url || !anon) {
    return {
      active: false,
      label: "Supabase",
      detail: "Sin variables",
    };
  }

  const active = await probe(`${cleanUrl(url)}/rest/v1/`, {
    apikey: anon,
    authorization: `Bearer ${anon}`,
  });

  return {
    active,
    label: "Supabase",
    detail: active ? "Online" : "Sin respuesta",
  };
}

async function checkNova(): Promise<Check> {
  const url = env("NOVA_AGI_HEALTH_URL", "NOVA_HEALTH_URL", "NOVA_AGI_URL", "NOVA_URL");
  const key = env("NOVA_ORCHESTRATOR_KEY", "NOVA_API_KEY");

  if (!url) {
    return {
      active: false,
      label: "NOVA",
      detail: "Sin endpoint",
    };
  }

  const base = cleanUrl(url);
  const headers: HeadersInit = key ? { authorization: `Bearer ${key}` } : {};

  const active =
    (await probe(`${base}/api/health`, headers)) ||
    (await probe(`${base}/health`, headers)) ||
    (await probe(base, headers));

  return {
    active,
    label: "NOVA",
    detail: active ? "Online" : "Sin respuesta",
  };
}

async function checkAgentByUrl(): Promise<Check | null> {
  const url = env("HOCKER_NODE_AGENT_HEALTH_URL", "HOCKER_NODE_AGENT_URL");

  if (!url) return null;

  const base = cleanUrl(url);
  const active =
    (await probe(`${base}/health`)) ||
    (await probe(`${base}/ready`)) ||
    (await probe(base));

  return {
    active,
    label: "Agente",
    detail: active ? "Online" : "Sin respuesta",
  };
}

async function checkAgentBySupabase(): Promise<Check> {
  const supabaseUrl = env("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
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

    const age = secondsSince(node.last_seen_at || node.updated_at);
    const fresh = age !== null && age <= 120;
    const online = node.status === "online" || node.status === "degraded";

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
  const direct = await checkAgentByUrl();
  if (direct) return direct;

  return checkAgentBySupabase();
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

export async function GET(request: Request) {
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
      runtime: {
        node: process.version,
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      },
      checks: {
        web: {
          active: true,
          label: "Web",
          detail: "Online",
        },
        vercel: {
          active: vercelActive,
          label: "Vercel",
          detail: vercelActive ? "Activo" : "Local",
        },
        supabase,
        nova,
        agent,
        pwa,
        android: {
          active: androidShellReady,
          label: "Android",
          detail: androidShellReady ? "Shell listo" : "No detectado",
        },
        api: {
          active: true,
          label: "API",
          detail: "Online",
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
