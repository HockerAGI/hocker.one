import { z } from "zod";
import { executeApprovedAgiAction } from "@/lib/agi-action-execution";
import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ExecuteSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  action_id: z.string().uuid(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = ExecuteSchema.parse(await parseBody(req));
    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);
    const item = await executeApprovedAgiAction({ project_id: ctx.project_id, action_id: parsed.action_id, actor_id: ctx.user.id });

    return json({
      ok: true,
      executed: true,
      item,
      message: "Acción aprobada ejecutada por worker seguro. Resultado guardado en auditoría.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
