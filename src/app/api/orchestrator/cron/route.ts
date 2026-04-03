import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

  const baseUrl = (
    process.env.ORCHESTRATOR_BASE_URL ??
    new URL(req.url).origin
  ).replace(/\/+$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(new URL("/api/orchestrator/run", baseUrl), {
      method: "POST",
      headers: {
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