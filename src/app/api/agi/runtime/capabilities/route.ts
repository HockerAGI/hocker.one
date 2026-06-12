import { z } from "zod";
import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getCapabilityRegistrySnapshot, getHockerCapabilitiesContract } from "@/lib/hocker-capabilities-contract";
import { routeHockerCapabilityRequest } from "@/lib/hocker-tool-router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RouteSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  message: z.string().min(1),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one").trim();

    await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    return json({
      ...getHockerCapabilitiesContract(project_id),
      registry: getCapabilityRegistrySnapshot(),
      message: "Contrato de capacidades HOCKER 12.7E leído con seguridad. No ejecuta acciones.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = RouteSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return json({ ok: false, error: "Payload inválido para router de capacidades.", issues: parsed.error.flatten() }, 400);
    }

    await requireProjectRole(parsed.data.project_id, ["owner", "admin", "operator", "viewer"]);

    const contract = getHockerCapabilitiesContract(parsed.data.project_id);

    return json({
      ok: true,
      project_id: parsed.data.project_id,
      checked_at: new Date().toISOString(),
      decision: routeHockerCapabilityRequest(parsed.data.message, contract),
      contract: contract.public_context,
      message: "Router de capacidades evaluado. No ejecuta acciones.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
