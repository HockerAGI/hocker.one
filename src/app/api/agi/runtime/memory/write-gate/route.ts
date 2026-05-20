import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import {
  buildSyntiaCuratedMemoryHandoff,
  buildSyntiaMemoryProposalPreflight,
  getSyntiaMemoryWriteGatePublicContext,
  submitSyntiaMemoryProposal,
} from "@/lib/syntia-memory-write-gate";

export const dynamic = "force-dynamic";

function str(value: unknown, fallback = "") {
  return String(value ?? "").trim() || fallback;
}

export async function GET(req: NextRequest) {
  const traceId = randomUUID();
  const gate = requireOwnerOrInternal(req, traceId);
  if (gate) return gate;

  const url = new URL(req.url);
  const action = str(url.searchParams.get("action"), "contract");

  if (action === "handoff") {
    return NextResponse.json(
      await buildSyntiaCuratedMemoryHandoff({
        project_id: url.searchParams.get("project_id") || "hocker-one",
        target_agi_id: url.searchParams.get("target_agi_id") || undefined,
        limit: url.searchParams.get("limit") || undefined,
      }),
    );
  }

  return NextResponse.json({
    ok: true,
    trace_id: traceId,
    message: "Memory Write Gate 12.7G activo. GET no escribe memoria.",
    public_context: getSyntiaMemoryWriteGatePublicContext(),
  });
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const gate = requireOwnerOrInternal(req, traceId);
  if (gate) return gate;

  const input = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = str(input.action, "preflight");

  if (action === "preflight") {
    return NextResponse.json(await buildSyntiaMemoryProposalPreflight(input));
  }

  if (action === "submit_proposal") {
    return NextResponse.json(await submitSyntiaMemoryProposal(input, traceId));
  }

  if (action === "curated_handoff") {
    return NextResponse.json(await buildSyntiaCuratedMemoryHandoff(input));
  }

  return NextResponse.json(
    {
      ok: false,
      trace_id: traceId,
      reason: "unsupported_memory_write_gate_action",
      allowed_actions: ["preflight", "submit_proposal", "curated_handoff"],
    },
    { status: 400 },
  );
}
