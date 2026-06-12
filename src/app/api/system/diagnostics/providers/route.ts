import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import {
  getHockerDiagnosticsProviderInventory,
  getHockerDiagnosticsProviderRouterPublicContext,
} from "@/lib/hocker-diagnostics-provider-router";

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
      checked_at: new Date().toISOString(),
      context: getHockerDiagnosticsProviderRouterPublicContext(),
      inventory: getHockerDiagnosticsProviderInventory(),
      policy: {
        read_only_endpoint: true,
        no_llm_provider_selection: true,
        no_nova_agi_router_duplication: true,
        no_productive_action_execution: true,
        owner_gate_required_for_github_actions_dispatch: true,
      },
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
