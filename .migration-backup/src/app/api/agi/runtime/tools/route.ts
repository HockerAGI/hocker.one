import { getRuntimeToolCatalog } from "@/lib/agi-runtime-core";
import { json, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const project_id = String(
      url.searchParams.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one",
    ).trim();

    await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const tools = getRuntimeToolCatalog();
    const counts = tools.reduce(
      (acc, tool) => {
        acc.total += 1;
        acc[tool.status] = (acc[tool.status] || 0) + 1;
        return acc;
      },
      { total: 0 } as Record<string, number>,
    );

    return json({
      ok: true,
      project_id,
      checked_at: new Date().toISOString(),
      counts,
      tools,
      message: "Catálogo de herramientas AGI normalizado. No expone secretos.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
