import { NextRequest } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { createAuditFingerprint } from "@/lib/audit-chain";
import { json, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = requireOwnerOrInternal(req);
  if (gate) return gate;

  try {
    const params = new URL(req.url).searchParams;
    const project_id = (params.get("project_id") ?? "hocker-one").trim();

    const result = await createAuditFingerprint(project_id);
    return json({ ok: true, result }, 200);
  } catch (error) {
    const e = toApiError(error);
    return json({ ok: false, error: e.payload.error }, e.status);
  }
}
