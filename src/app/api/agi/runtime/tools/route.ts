import { getRuntimeToolSummary } from "@/lib/agi-runtime-core";
import { json, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one").trim();

    await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    return json({
      ok: true,
      project_id,
      ...getRuntimeToolSummary(),
      message: "Catálogo de herramientas normalizado. No expone secretos; solo presencia de configuración.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
