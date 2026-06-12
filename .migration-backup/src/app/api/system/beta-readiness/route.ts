import { NextRequest, NextResponse } from "next/server";
import { collectHockerBetaReadiness } from "@/lib/hocker-beta-readiness";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const emitEvent = url.searchParams.get("emit_event") !== "0";

  const result = await collectHockerBetaReadiness({
    emitEvent,
  });

  return NextResponse.json(result);
}
