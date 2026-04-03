import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function runOrchestrator(req: Request): Promise<NextResponse> {
  const baseUrl = (process.env.ORCHESTRATOR_BASE_URL ?? new URL(req.url).origin).replace(/\/+$/, "");
  const target = new URL("/api/orchestrator/run", baseUrl);

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      cache: "no-store",
    });

    const payload = await res.json().catch(() => ({ ok: res.ok }));
    return NextResponse.json(payload, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fallo al ejecutar cron.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  return runOrchestrator(req);
}

export async function POST(req: Request): Promise<NextResponse> {
  return runOrchestrator(req);
}