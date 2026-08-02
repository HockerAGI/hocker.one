import { getVerifiedAgiRuntimeSummary } from "@/lib/verified-agi-runtime";
import { json, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const projectId = String(
      url.searchParams.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one",
    ).trim();
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
    const summary = await getVerifiedAgiRuntimeSummary(ctx.project_id);
    return json({ ok: true, summary });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
