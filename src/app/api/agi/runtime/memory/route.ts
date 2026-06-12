import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getSyntiaOperationalMemorySnapshot } from "@/lib/syntia-operational-memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
    const snapshot = await getSyntiaOperationalMemorySnapshot(ctx.project_id);

    return json({
      ...snapshot,
      message: "Snapshot operacional de SYNTIA leído con seguridad. Solo lectura. No ejecuta acciones.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
