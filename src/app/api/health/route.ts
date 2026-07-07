import { getErrorMessage } from "@/lib/errors";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { log } from "@/lib/logger";
import { sanitizePublicError } from "@/lib/sanitize-error";
import { NextRequest, NextResponse } from "next/server";

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

function hasRealValue(value: string | undefined | null): boolean {
  const normalized = String(value ?? "").trim();
  if (!normalized) return false;

  const placeholders = new Set([
    "__SET_AFTER_NOVA_DEPLOY__",
    "_SET_AFTER_NOVA_DEPLOY__",
    "no-configurado",
  ]);

  return !placeholders.has(normalized);
}

function buildEnvChecks(): Omit<HealthChecks, "db"> {
  return {
    supabaseUrl: hasRealValue(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL),
    supabaseAnon: hasRealValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    novaAgi: hasRealValue(process.env.NOVA_AGI_URL ?? process.env.ORCHESTRATOR_BASE_URL),
    novaKey: hasRealValue(process.env.NOVA_ORCHESTRATOR_KEY),
    commandHmac: hasRealValue(
      process.env.HOCKER_COMMAND_HMAC_SECRET ?? process.env.COMMAND_HMAC_SECRET,
    ),
    langfuse:
      hasRealValue(process.env.LANGFUSE_PUBLIC_KEY) &&
      hasRealValue(process.env.LANGFUSE_SECRET_KEY),
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

export async function GET(req: NextRequest) {
  const authGate = requireOwnerOrInternal(req);
  if (authGate) return authGate;

  const envChecks = buildEnvChecks();
  log.info("Health check initiated", { route: "/api/health" });

  try {
    const sb = createAdminSupabase();
    const { error } = await sb.from("nodes").select("id").limit(1);

    if (error) {
      log.warn("Health check: database unreachable", { route: "/api/health", detail: getErrorMessage(error) });
      const payload = buildPayload(
        { ...envChecks, db: false },
        undefined,
        "Pérdida de sincronía con el núcleo de datos.",
        sanitizePublicError(error),
      );
      return NextResponse.json(payload, { status: 503 });
    }

    const payload = buildPayload(
      { ...envChecks, db: true },
      "Sistemas operativos bajo parámetros nominales.",
    );

    return NextResponse.json(payload, { status: 200 });
  } catch (err: unknown) {
    log.error("Health check critical failure", { route: "/api/health", detail: sanitizePublicError(err) });
    const payload = buildPayload(
      { ...envChecks, db: false },
      undefined,
      "Fallo crítico en el monitoreo.",
      sanitizePublicError(err),
    );
    return NextResponse.json(payload, { status: 503 });
  }
}
