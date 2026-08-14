import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgiEvalSuite } from "@/lib/agi-runtime-eval-runner";
import { getAgiEvalSuite } from "@/lib/agi-eval-suites";
import { canonicalAgiId } from "@/lib/hocker-agi-operational";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const BodySchema = z.object({
  agi_id: z.string().trim().min(1).max(100),
}).strict();

export async function POST(req: Request): Promise<Response> {
  const owner = await requireOwnerAal2Api("hocker-one");
  if (!owner.ok) return owner.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        executed: false,
        evaluation_only: true,
        error: "invalid_eval_request",
        message: "Provide exactly one canonical agi_id.",
      },
      { status: 400 },
    );
  }

  const agiId = canonicalAgiId(parsed.data.agi_id);
  const suite = getAgiEvalSuite(agiId);
  if (!suite || suite.agi_id !== agiId) {
    return NextResponse.json(
      {
        ok: false,
        executed: false,
        evaluation_only: true,
        error: "agi_eval_suite_not_found",
      },
      { status: 400 },
    );
  }

  try {
    const result = await runAgiEvalSuite({
      agi_id: agiId,
      actor_user_id: owner.userId,
      oidc_token: req.headers.get("x-vercel-oidc-token"),
    });
    return NextResponse.json(result, {
      status: result.passed ? 200 : 422,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AGI_EVAL_RUNTIME_FAILED";
    return NextResponse.json(
      {
        ok: false,
        executed: false,
        evaluation_only: true,
        error: "agi_eval_runtime_failed",
        message,
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
