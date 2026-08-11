import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ContextBridgeManifestSchema,
  createContextBridgeManifest,
} from "@/lib/context-bridge";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { sanitizePublicError } from "@/lib/sanitize-error";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function deploymentIdentity() {
  return {
    candidateSha: String(
      process.env.VERCEL_GIT_COMMIT_SHA
        ?? process.env.GITHUB_SHA
        ?? "local-unversioned",
    ).trim(),
    environment: String(
      process.env.VERCEL_ENV
        ?? process.env.NODE_ENV
        ?? "unknown",
    ).trim(),
  };
}

export async function POST(req: NextRequest) {
  const traceId = crypto.randomUUID();
  const ownerSession = await requireOwnerAal2Api();
  if (!ownerSession.ok) return ownerSession.response;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ContextBridgeManifestSchema.safeParse(body);
    if (!parsed.success || !parsed.data.activate) {
      return NextResponse.json({
        ok: false,
        trace_id: traceId,
        owner_gate: "blocked",
        owner_gate_actor: "owner",
        created: false,
        activated: false,
        error: "Se requiere un manifiesto válido con activate=true.",
        issues: parsed.success ? undefined : parsed.error.flatten(),
      }, { status: 400 });
    }

    const result = await createContextBridgeManifest(
      parsed.data,
      `context-bridge:owner-session:${ownerSession.userId}`,
    );
    if (!result.complete) {
      return NextResponse.json({
        ok: false,
        trace_id: traceId,
        owner_gate: "blocked",
        owner_gate_actor: "owner",
        created: true,
        activated: false,
        error: "El manifiesto no tiene cobertura completa y no puede activarse.",
        result,
      }, { status: 409 });
    }

    const manifestRecord = result.manifest as Record<string, unknown> | null;
    const manifestId = String(manifestRecord?.id ?? "");
    const projectId = String(manifestRecord?.project_id ?? parsed.data.project_id ?? "hocker-one");
    if (!manifestId) throw new Error("El borrador no devolvió un identificador activable.");

    const { candidateSha, environment } = deploymentIdentity();
    const nonce = crypto.randomUUID();
    const action = "context_bridge.activate_manifest";
    const resourceType = "context_bridge_manifest";
    const acceptedHeader = "supabase-session-aal2";
    const requestHash = createHash("sha256").update(JSON.stringify({
      project_id: projectId,
      actor_type: "owner",
      owner_user_id: ownerSession.userId,
      gate_version: ownerSession.version,
      accepted_header: acceptedHeader,
      action,
      resource_type: resourceType,
      resource_id: manifestId,
      candidate_sha: candidateSha,
      environment,
      trace_id: traceId,
      nonce,
      current_aal: ownerSession.currentLevel,
    })).digest("hex");

    const supabase = createAdminSupabase();
    const { data: approval, error: approvalError } = await supabase
      .rpc("record_owner_gate_approval", {
        p_payload: {
          project_id: projectId,
          actor_type: "owner",
          gate_version: ownerSession.version,
          accepted_header: acceptedHeader,
          action,
          resource_type: resourceType,
          resource_id: manifestId,
          candidate_sha: candidateSha,
          environment,
          trace_id: traceId,
          nonce,
          request_hash: requestHash,
          evidence: {
            authentication: "supabase-session-aal2",
            owner_user_id: ownerSession.userId,
            current_aal: ownerSession.currentLevel,
            request_path: req.nextUrl.pathname,
          },
        },
      })
      .single();
    if (approvalError) throw approvalError;

    const approvalRecord = approval as Record<string, unknown> | null;
    const approvalId = String(approvalRecord?.id ?? "");
    if (!approvalId) throw new Error("Owner Gate no devolvió evidencia de aprobación.");

    const { data: activatedManifest, error: activationError } = await supabase
      .rpc("activate_context_bridge_manifest_v2", {
        p_manifest_id: manifestId,
        p_approval_id: approvalId,
      })
      .single();
    if (activationError) throw activationError;

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      owner_gate: "approved",
      owner_gate_actor: "owner",
      owner_gate_version: ownerSession.version,
      owner_gate_approval_id: approvalId,
      created: true,
      activated: true,
      result: { ...result, manifest: activatedManifest },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      trace_id: traceId,
      owner_gate: "blocked",
      owner_gate_actor: "owner",
      created: false,
      activated: false,
      error: sanitizePublicError(error),
    }, { status: 500 });
  }
}
