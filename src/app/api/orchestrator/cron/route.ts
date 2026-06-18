import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function runOrchestrator(req: Request): Promise<NextResponse> {
  const cronSecret = String(process.env.CRON_SECRET ?? "").trim();

  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET no configurado." },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // El forward interno a /api/orchestrator/run debe usar EXACTAMENTE la misma
  // precedencia de token que ese endpoint valida (HOCKER_ONE_INTERNAL_TOKEN, y
  // si no existe, CRON_SECRET). Reenviar solo CRON_SECRET provoca un 401 cuando
  // ambos secretos difieren. Mismo patrón que commands/ y commands/approve/.
  const internalSecret = String(
    process.env.HOCKER_ONE_INTERNAL_TOKEN ??
      process.env.CRON_SECRET ??
      "",
  ).trim();

  if (!internalSecret) {
    return NextResponse.json(
      { ok: false, error: "HOCKER_ONE_INTERNAL_TOKEN / CRON_SECRET no configurado para despachar al orquestador." },
      { status: 500 },
    );
  }

  const baseUrl = (
    process.env.ORCHESTRATOR_BASE_URL ??
    new URL(req.url).origin
  ).replace(/\/+$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    const res = await fetch(new URL("/api/orchestrator/run", baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${internalSecret}`,
        "content-type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const payload = await res.json().catch(() => ({ ok: res.ok }));
    return NextResponse.json(payload, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fallo al ejecutar cron.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  return runOrchestrator(req);
}

export async function POST(req: Request): Promise<NextResponse> {
  return runOrchestrator(req);
}