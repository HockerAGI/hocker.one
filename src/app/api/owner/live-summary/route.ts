import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { getHockerLiveSummary } from "@/lib/hocker-live-summary";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const traceId = randomUUID();
  const gate = requireOwnerOrInternal(req, traceId);

  if (gate) return gate;

  try {
    const summary = await getHockerLiveSummary();

    return NextResponse.json({
      ...summary,
      trace_id: traceId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        reason: "live_summary_failed",
        message: error instanceof Error ? error.message : "No se pudo leer Live Summary.",
      },
      { status: 500 },
    );
  }
}
