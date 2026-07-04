import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { collectHockerBetaReadiness } from "@/lib/hocker-beta-readiness";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authGate = requireOwnerOrInternal(req);
  if (authGate) return authGate;

  const url = new URL(req.url);
  const emitEvent = url.searchParams.get("emit_event") !== "0";

  const result = await collectHockerBetaReadiness({
    emitEvent,
  });

  return NextResponse.json(result);
}
