import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveContextBridgeManifest } from "@/lib/context-bridge";
import { validateHockerOwnerApiGate } from "@/lib/hocker-owner-api-gate";
import { sanitizePublicError } from "@/lib/sanitize-error";

export const dynamic = "force-dynamic";

const ProjectSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9_.:-]+$/i);

export async function GET(req: NextRequest) {
  const traceId = crypto.randomUUID();
  const ownerGate = validateHockerOwnerApiGate(req);
  if (!ownerGate.ok) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      owner_gate: ownerGate.owner_gate,
      owner_gate_actor: ownerGate.actor,
    }, { status: ownerGate.status });
  }

  try {
    const parsedProject = ProjectSchema.safeParse(
      req.nextUrl.searchParams.get("project_id") ?? "hocker-one",
    );
    if (!parsedProject.success) {
      return NextResponse.json({
        ok: false,
        trace_id: traceId,
        error: "project_id inválido.",
      }, { status: 400 });
    }

    const manifest = await getActiveContextBridgeManifest(parsedProject.data);
    if (!manifest) {
      return NextResponse.json({
        ok: false,
        trace_id: traceId,
        active_manifest: null,
        error: "No existe un manifiesto activo para el proyecto.",
      }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      owner_gate: ownerGate.owner_gate,
      owner_gate_actor: ownerGate.actor,
      active_manifest: manifest,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      error: sanitizePublicError(error),
    }, { status: 500 });
  }
}
