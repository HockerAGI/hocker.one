import { NextResponse } from "next/server";
import { runAgiCertificationStep } from "@/lib/agi-certification-runner";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request): Promise<Response> {
  const owner = await requireOwnerAal2Api("hocker-one");
  if (!owner.ok) return owner.response;

  try {
    const result = await runAgiCertificationStep({
      actor_user_id: owner.userId,
      oidc_token: req.headers.get("x-vercel-oidc-token"),
    });
    const status = result.ok
      ? 200
      : result.retryable
        ? 503
        : 422;
    return NextResponse.json(result, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        complete: false,
        halted: true,
        retryable: false,
        error: "agi_certification_runtime_failed",
        message: "Owner certification step failed. Review durable evidence and logs.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
