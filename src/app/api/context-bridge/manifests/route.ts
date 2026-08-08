import { NextRequest, NextResponse } from "next/server";
import {
  ContextBridgeManifestSchema,
  createContextBridgeManifest,
} from "@/lib/context-bridge";
import { validateHockerOwnerApiGate } from "@/lib/hocker-owner-api-gate";
import { sanitizePublicError } from "@/lib/sanitize-error";
import { createAdminSupabase } from "@/lib/supabase-admin";

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

    if (parsed.data.activate && ownerGate.actor !== "owner") {
      return NextResponse.json({
        ok: false,
        trace_id: traceId,
        owner_gate: ownerGate.owner_gate,
        owner_gate_actor: ownerGate.actor,
        created: false,
        activated: false,
        error: "Una identidad interna puede crear borradores, pero solo Owner puede activar contexto.",
      }, { status: 403 });
    }

    const result = await createContextBridgeManifest(
      parsed.data,
      `context-bridge:${ownerGate.actor}`,
    );
    let activatedManifest: unknown = null;

    if (parsed.data.activate) {
      const manifestRecord = result.manifest as Record<string, unknown> | null;
      const manifestId = String(manifestRecord?.id ?? "");
      if (!manifestId) throw new Error("El borrador no devolvió un identificador activable.");

      const supabase = createAdminSupabase();
      const { data, error } = await supabase
        .rpc("activate_context_bridge_manifest", {
          p_manifest_id: manifestId,
          p_approved_by: "hocker-owner-gate",
        })
        .single();
      if (error) throw error;
      activatedManifest = data;
    }

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      owner_gate: ownerGate.owner_gate,
      owner_gate_actor: ownerGate.actor,
      created: true,
      activated: parsed.data.activate,
      result: parsed.data.activate
        ? { ...result, manifest: activatedManifest }
        : result,
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
