import { z } from "zod";
import { decideAgiAction } from "@/lib/agi-action-execution";
import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DecisionSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  action_id: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(2000).optional(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = DecisionSchema.parse(await parseBody(req));
    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);
    const item = await decideAgiAction({
      project_id: ctx.project_id,
      action_id: parsed.action_id,
      decision: parsed.decision,
      actor_id: ctx.user.id,
      note: parsed.note,
    });

    return json({
      ok: true,
      item,
      message: parsed.decision === "approve" ? "Acción aprobada por owner. Lista para ejecución controlada." : "Acción rechazada por owner. No se ejecutará.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
