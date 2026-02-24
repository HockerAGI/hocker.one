import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .select(`*, items:supply_order_items(*)`)
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new ApiError(500, { error: error.message });
    if (!data) throw new ApiError(404, { error: "Orden no encontrada" });

    return json({ ok: true, item: data });
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const trace = langfuse.trace({ name: "Supply_Order_Update", metadata: { orderId: params.id } });
  try {
    const { id } = params;
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "finance"] });

    // Evitar sobreescribir ID o Project_ID
    delete body.id;
    delete body.project_id;
    body.updated_at = new Date().toISOString();

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .update(body)
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: error.message });

    trace.event({ name: "Order_Status_Changed", input: body });
    await langfuse.flushAsync();

    return json({ ok: true, item: data });
  } catch (e: any) {
    trace.update({ level: "ERROR", statusMessage: e.message });
    await langfuse.flushAsync();
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}