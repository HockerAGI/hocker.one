import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import {
  getHockerProviderOrchestratorPublicContext,
  getHockerUnifiedProviderInventory,
} from "@/lib/hocker-provider-orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);

    return json({
      ok: true,
      project_id: ctx.project_id,
      context: getHockerProviderOrchestratorPublicContext(),
      inventory: await getHockerUnifiedProviderInventory(ctx.project_id),
      execution_policy: {
        read_only_endpoint: true,
        no_provider_executed: true,
        no_model_selection_exposed_to_user: true,
        nova_decides_provider_internally: true,
      },
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
