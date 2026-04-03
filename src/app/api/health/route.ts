import { getErrorMessage } from "@/lib/errors";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthChecks = {
  db: boolean;
  supabaseUrl: boolean;
  supabaseAnon: boolean;
  novaAgi: boolean;
  novaKey: boolean;
  commandHmac: boolean;
  langfuse: boolean;
};

type HealthPayload = {
  status: "online" | "degraded";
  infrastructure: string;
  checks: HealthChecks;
  message?: string;
  error?: string;
  details?: string;
  timestamp: string;
};

function buildEnvChecks(): Omit<HealthChecks, "db"> {
  return {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    novaAgi: Boolean(process.env.NOVA_AGI_URL),
    novaKey: Boolean(process.env.NOVA_ORCHESTRATOR_KEY),
    commandHmac: Boolean(process.env.COMMAND_HMAC_SECRET),
    langfuse: Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY),
  };
}

export async function GET(): Promise<NextResponse<HealthPayload>> {
  const baseChecks = buildEnvChecks();
  const timestamp = new Date().toISOString();

  try {
    const sb = createAdminSupabase();

    const { error } = await sb
      .from("nodes")
      .select("id")
      .limit(1);

    if (error) {
      const payload: HealthPayload = {
        status: "degraded",
        infrastructure: "Hocker ONE Automation Fabric",
        checks: { ...baseChecks, db: false },
        error: "Pérdida de sincronía con el núcleo de datos.",
        details: getErrorMessage(error),
        timestamp,
      };

      return NextResponse.json(payload, { status: 500 });
    }

    const payload: HealthPayload = {
      status: "online",
      infrastructure: "Hocker ONE Automation Fabric",
      checks: { ...baseChecks, db: true },
      message: "Sistemas operativos bajo parámetros nominales.",
      timestamp,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const payload: HealthPayload = {
      status: "degraded",
      infrastructure: "Hocker ONE Automation Fabric",
      checks: { ...baseChecks, db: false },
      error: "Fallo crítico en el monitoreo.",
      details: getErrorMessage(err),
      timestamp,
    };

    return NextResponse.json(payload, { status: 500 });
  }
}