import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getHockerContinuityContextPack } from "@/lib/hocker-context-pack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
    return json({ ...getHockerContinuityContextPack(), project_id: ctx.project_id });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
