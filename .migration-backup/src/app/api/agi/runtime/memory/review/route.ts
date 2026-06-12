import { randomUUID } from "crypto";
import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import {
  decideSyntiaMemoryReview,
  getSyntiaMemoryReviewGatePublicContext,
  listSyntiaMemoryReviewQueue,
} from "@/lib/syntia-memory-review-gate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || "hocker-one";
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
    const snapshot = await listSyntiaMemoryReviewQueue(ctx.project_id, Number(query.get("limit") || 50));

    return json({
      ...snapshot,
      role: ctx.role,
      message: "Memory Review Gate 12.7H leído con seguridad. GET no publica memoria.",
    });
  } catch (e) {
    const err = toApiError(e);
    return json(err.body, err.status);
  }
}

export async function POST(req: Request) {
  const traceId = randomUUID();

  try {
    const input = await parseBody(req);
    const projectId = String(input.project_id || "hocker-one");
    const ctx = await requireProjectRole(projectId, ["owner"]);

    const action = String(input.action || "decision").trim().toLowerCase();

    if (action === "list") {
      return json(await listSyntiaMemoryReviewQueue(ctx.project_id));
    }

    if (action !== "decision") {
      return json(
        {
          ok: false,
          trace_id: traceId,
          reason: "unsupported_memory_review_action",
          allowed_actions: ["list", "decision"],
          public_context: getSyntiaMemoryReviewGatePublicContext(),
        },
        400,
      );
    }

    const result = await decideSyntiaMemoryReview(
      { ...input, project_id: ctx.project_id },
      "session_owner",
      traceId,
    );

    return json(result, Number(result.http_status || 200));
  } catch (e) {
    const err = toApiError(e);
    return json({ ...err.body, trace_id: traceId }, err.status);
  }
}
