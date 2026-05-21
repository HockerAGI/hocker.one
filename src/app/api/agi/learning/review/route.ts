import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { validateHockerOwnerApiGate } from "@/lib/hocker-owner-api-gate";
import { decideSyntiaMemoryReview } from "@/lib/syntia-memory-review-gate";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const gate = validateHockerOwnerApiGate(req);

  if (!gate.ok) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        executed: false,
        real_execution_enabled: false,
        execution_lock: true,
        owner_gate: gate.owner_gate,
        owner_gate_actor: gate.actor,
        owner_gate_reason: gate.reason,
        owner_gate_version: gate.version,
        message: "Owner/internal gate rejected the request.",
      },
      { status: gate.status },
    );
  }

  const input = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await decideSyntiaMemoryReview(input, gate.actor, traceId);

  return NextResponse.json(result, { status: Number(result.http_status || 200) });
}
