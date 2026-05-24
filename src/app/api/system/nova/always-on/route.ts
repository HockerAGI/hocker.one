import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getHockerNovaAlwaysOnAwarenessContext } from "@/lib/hocker-nova-always-on-awareness";

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
      awareness: getHockerNovaAlwaysOnAwarenessContext(),
      policy: {
        read_only_endpoint: true,
        no_llm_provider_selection: true,
        no_provider_metadata_to_public_ui: true,
        no_productive_action_execution: true,
      },
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
