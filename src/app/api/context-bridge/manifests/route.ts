import { NextRequest, NextResponse } from "next/server";
import {
  ContextBridgeManifestSchema,
  createContextBridgeManifest,
} from "@/lib/context-bridge";
import { validateHockerOwnerApiGate } from "@/lib/hocker-owner-api-gate";
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
      created: false,
    }, { status: ownerGate.status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ContextBridgeManifestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        trace_id: traceId,
        owner_gate: ownerGate.owner_gate,
        owner_gate_actor: ownerGate.actor,
        created: false,
        error: "Solicitud de manifiesto inválida.",
        issues: parsed.error.flatten(),
      }, { status: 400 });
    }

    if (parsed.data.activate) {
      return NextResponse.json({
        ok: false,
        trace_id: traceId,
        owner_gate: ownerGate.owner_gate,
        owner_gate_actor: ownerGate.actor,
        created: false,
        activated: false,
        mfa_required: true,
        error: "La activación de Context Bridge requiere una sesión Owner con MFA AAL2.",
      }, { status: 409 });
    }

    const result = await createContextBridgeManifest(
      parsed.data,
      `context-bridge:${ownerGate.actor}`,
    );

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      owner_gate: ownerGate.owner_gate,
      owner_gate_actor: ownerGate.actor,
      owner_gate_approval_id: null,
      created: true,
      activated: false,
      result,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      owner_gate: ownerGate.owner_gate,
      owner_gate_actor: ownerGate.actor,
      created: false,
      error: sanitizePublicError(error),
    }, { status: 500 });
  }
}
