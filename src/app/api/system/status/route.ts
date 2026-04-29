import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function hasEnv(name: string): boolean {
  return typeof process.env[name] === "string" && process.env[name]!.trim().length > 0;
}

export async function GET() {
  const supabaseReady =
    hasEnv("NEXT_PUBLIC_SUPABASE_URL") &&
    hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const novaReady =
    hasEnv("NOVA_AGI_URL") &&
    hasEnv("NOVA_ORCHESTRATOR_KEY");

  const vercelReady =
    hasEnv("VERCEL") ||
    hasEnv("VERCEL_ENV") ||
    process.env.NODE_ENV === "production";

  const nodeRuntime = process.version;

  return NextResponse.json(
    {
      ok: true,
      service: "hocker.one",
      timestamp: new Date().toISOString(),
      runtime: {
        node: nodeRuntime,
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown"
      },
      checks: {
        web: {
          active: true,
          label: "Web",
          detail: "Online"
        },
        vercel: {
          active: vercelReady,
          label: "Vercel",
          detail: vercelReady ? "Activo" : "No detectado"
        },
        supabase: {
          active: supabaseReady,
          label: "Supabase",
          detail: supabaseReady ? "Conectado" : "Sin variables"
        },
        nova: {
          active: novaReady,
          label: "NOVA",
          detail: novaReady ? "Configurada" : "Sin conexión"
        }
      }
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
