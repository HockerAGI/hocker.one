import { NextRequest, NextResponse } from "next/server";
import {
  ContextBridgeCheckpointSchema,
  createContextBridgeCheckpoint,
} from "@/lib/context-bridge";
import { validateHockerOwnerApiGate } from "@/lib/hocker-owner-api-gate";
import { log } from "@/lib/logger";
import { sanitizePublicError } from "@/lib/sanitize-error";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const traceId = crypto.randomUUID();
  const ownerGate = validateHockerOwnerApiGate(req);

  if (!ownerGate.ok) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      owner_gate: ownerGate.owner_gate,
      owner_gate_actor: ownerGate.actor,
      owner_gate_reason: ownerGate.reason,
      stored: false,
    }, { status: ownerGate.status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ContextBridgeCheckpointSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        trace_id: traceId,
        owner_gate: ownerGate.owner_gate,
        owner_gate_actor: ownerGate.actor,
        stored: false,
        error: "Checkpoint de contexto inválido.",
        issues: parsed.error.flatten(),
      }, { status: 400 });
    }

    const checkpoint = await createContextBridgeCheckpoint(
      parsed.data,
      `context-bridge:${ownerGate.actor}`,
    );

    log.info("Context Bridge checkpoint stored", {
      route: "/api/context-bridge/checkpoints",
      trace_id: traceId,
      owner_gate_actor: ownerGate.actor,
      project_id: parsed.data.project_id,
      source_id: parsed.data.source_id,
      provider: parsed.data.provider,
      source_revision: parsed.data.source_revision,
      content_hash: checkpoint.content_hash,
    });

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      owner_gate: ownerGate.owner_gate,
      owner_gate_actor: ownerGate.actor,
      stored: true,
      checkpoint,
    }, { status: 201 });
  } catch (error) {
    log.error("Context Bridge checkpoint failure", {
      route: "/api/context-bridge/checkpoints",
      trace_id: traceId,
      owner_gate_actor: ownerGate.actor,
      detail: sanitizePublicError(error),
    });

    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      owner_gate: ownerGate.owner_gate,
      owner_gate_actor: ownerGate.actor,
      stored: false,
      error: sanitizePublicError(error),
    }, { status: 500 });
  }
}
