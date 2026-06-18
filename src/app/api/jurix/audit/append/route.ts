import { NextRequest } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { appendAuditRecord } from "@/lib/audit-chain";
import { json, parseBody, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = requireOwnerOrInternal(req);
  if (gate) return gate;

  try {
    const body = await parseBody(req);

    const row = await appendAuditRecord({
      project_id: String(body.project_id ?? "hocker-one").trim(),
      action: String(body.action ?? "manual_append").trim(),
      actor_user_id: body.actor_user_id == null ? null : String(body.actor_user_id),
      context:
        body.context && typeof body.context === "object" && !Array.isArray(body.context)
          ? (body.context as Record<string, unknown>)
          : {},
    });

    return json({ ok: true, row }, 200);
  } catch (error) {
    const e = toApiError(error);
    return json({ ok: false, error: e.payload.error }, e.status);
  }
}
