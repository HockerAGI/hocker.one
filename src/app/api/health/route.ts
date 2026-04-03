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

function buildPayload(
  checks: HealthChecks,
  message?: string,
  error?: string,
  details?: string,
): HealthPayload {
  const online = Object.values(checks).every(Boolean);
  return {
    status: online ? "online" : "degraded",
    infrastructure: "Hocker ONE Control Plane",
    checks,
    ...(message ? { message } : {}),
    ...(error ? { error } : {}),
    ...(details ? { details } : {}),
    timestamp: new Date().toISOString(),
  };
}

export async function GET(): Promise<NextResponse<HealthPayload>> {
  const envChecks = buildEnvChecks();

  try {
    const sb = createAdminSupabase();
    const { error } = await sb.from("nodes").select("id").limit(1);

    if (error) {
      const payload = buildPayload(
        { ...envChecks, db: false },
        undefined,
        "Pérdida de sincronía con el núcleo de datos.",
        getErrorMessage(error),
      );
      return NextResponse.json(payload, { status: 503 });
    }

    const payload = buildPayload(
      { ...envChecks, db: true },
      "Sistemas operativos bajo parámetros nominales.",
    );

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    const payload = buildPayload(
      { ...envChecks, db: false },
      undefined,
      "Fallo crítico en el monitoreo.",
      getErrorMessage(err),
    );
    return NextResponse.json(payload, { status: 503 });
  }
}