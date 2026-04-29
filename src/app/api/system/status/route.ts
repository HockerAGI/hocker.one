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

async function checkAgent(): Promise<Check> {
  const url = env("HOCKER_NODE_AGENT_HEALTH_URL", "HOCKER_NODE_AGENT_URL");

  if (!url) {
    return {
      active: false,
      label: "Agente",
      detail: "Sin endpoint",
    };
  }

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

function fileExists(...parts: string[]): boolean {
  return existsSync(join(process.cwd(), ...parts));
}

export async function GET() {
  const vercelActive = Boolean(env("VERCEL", "VERCEL_ENV", "VERCEL_URL"));

  const pwaActive =
    fileExists("public", "manifest.webmanifest") ||
    fileExists("public", "manifest.json");

  const androidShellReady =
    fileExists("android", "app", "src", "main", "AndroidManifest.xml") ||
    env("ANDROID_APP_READY", "NEXT_PUBLIC_ANDROID_APP_READY") === "1";

  const [supabase, nova, agent] = await Promise.all([
    checkSupabase(),
    checkNova(),
    checkAgent(),
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
        pwa: {
          active: pwaActive,
          label: "PWA",
          detail: pwaActive ? "Lista" : "Sin manifest",
        },
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
