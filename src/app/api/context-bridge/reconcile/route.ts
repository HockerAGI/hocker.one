import { timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { reconcileProjectContinuity } from "@/lib/project-continuity";
import { getNovaZeroCreditSnapshot } from "@/lib/nova-zero-credit-snapshot";
import { processVerifiedFailureLearning } from "@/lib/nova-deterministic-learning";
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
    const observation = getNovaZeroCreditSnapshot()
      .then((snapshot) => ({ ok: true as const, snapshot }))
      .catch(() => ({ ok: false as const, reason: "NOVA_ZERO_CREDIT_OBSERVATION_UNAVAILABLE" }));
    const learning = processVerifiedFailureLearning()
      .then((summary) => ({ ok: true as const, summary }))
      .catch(() => ({ ok: false as const, reason: "NOVA_LEARNING_TRIAGE_UNAVAILABLE" }));
    const [result, zeroCreditObservation, learningTriage] = await Promise.all([
      reconcileProjectContinuity(), observation, learning,
    ]);
    return NextResponse.json({
      ...result,
      zero_credit_observation: zeroCreditObservation,
      learning_triage: learningTriage,
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
