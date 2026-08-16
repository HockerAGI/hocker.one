import { timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { reconcileProjectContinuity } from "@/lib/project-continuity";
import { sanitizePublicError } from "@/lib/sanitize-error";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function expectedToken(): string | null {
  return process.env.CRON_SECRET ?? process.env.HOCKER_ONE_INTERNAL_TOKEN ?? null;
}

function bearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length);
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  const traceId = crypto.randomUUID();
  const expected = expectedToken();
  const provided = bearerToken(req);

  if (!expected || !provided || !safeEqual(provided, expected)) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      reconciled: false,
      error: "No autorizado.",
    }, { status: 401 });
  }

  try {
    const result = await reconcileProjectContinuity();
    return NextResponse.json({
      ...result,
      trace_id: traceId,
      reconciled: true,
      manifest_activated: false,
      external_mutations: false,
    }, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      reconciled: false,
      manifest_activated: false,
      external_mutations: false,
      error: sanitizePublicError(error),
    }, { status: 500 });
  }
}
