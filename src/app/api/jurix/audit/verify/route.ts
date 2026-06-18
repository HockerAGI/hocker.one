import { NextRequest } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { verifyAuditChain } from "@/lib/audit-chain";
import { json, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asInt(value: string | null, fallback: number): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: NextRequest) {
  const gate = requireOwnerOrInternal(req);
  if (gate) return gate;

  try {
    const params = new URL(req.url).searchParams;
    const project_id = (params.get("project_id") ?? "hocker-one").trim();
    const limit = Math.max(1, Math.min(asInt(params.get("limit"), 5000), 5000));

    const result = await verifyAuditChain(project_id, limit);
    return json({ ok: true, result }, 200);
  } catch (error) {
    const e = toApiError(error);
    return json({ ok: false, error: e.payload.error }, e.status);
  }
}
