import { z } from "zod";
import { buildOwnerActionReview } from "@/lib/owner-action-review";
import { decideAgiAction, listAgiActions } from "@/lib/agi-action-execution";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DecisionSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  action_id: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(2000).optional(),
  expected_review_fingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const query = new URL(req.url).searchParams;
    const parsed = z.object({ project_id: z.string().min(1), action_id: z.string().uuid() }).parse({
      project_id: query.get("project_id"), action_id: query.get("action_id"),
    });
    const gate = await requireOwnerAal2Api(parsed.project_id);
    if (!gate.ok) return gate.response;
    const [item] = await listAgiActions({ project_id: parsed.project_id, action_id: parsed.action_id, limit: 1 });
    if (!item) return json({ ok: false, error: "ACTION_NOT_FOUND" }, 404);
    return json({ ok: true, review: buildOwnerActionReview(item), can_approve: process.env.VERCEL_ENV === "production" && item.status === "needs_approval" });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = DecisionSchema.parse(await parseBody(req));
    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);

    // Preview can inspect the persisted queue, but cannot mutate its decisions.
    if (process.env.VERCEL_ENV === "preview") {
      return json({ ok: false, error: "Preview de solo lectura para decisiones de acciones." }, 403);
    }

    if (parsed.decision === "approve") {
      const ownerGate = await requireOwnerAal2Api(parsed.project_id);
      if (!ownerGate.ok) return ownerGate.response;
    }

    if (parsed.expected_review_fingerprint && (parsed.decision !== "approve" || process.env.VERCEL_ENV !== "production")) {
      return json({ ok: false, error: "La revisión en Preview no permite aprobar cambios reales." }, 403);
    }

    const item = await decideAgiAction({
      project_id: ctx.project_id,
      action_id: parsed.action_id,
      decision: parsed.decision,
      actor_id: ctx.user.id,
      note: parsed.note,
      expected_review_fingerprint: parsed.expected_review_fingerprint,
    });

    return json({
      ok: true,
      item,
      message: parsed.decision === "approve" ? "Acción aprobada por owner con step-up MFA. Lista para ejecución controlada." : "Acción rechazada por owner. No se ejecutará.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
