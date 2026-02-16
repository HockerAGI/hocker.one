import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") || "global").trim();
    const id = String(params.id || "").trim();

    if (!id) throw new ApiError(400, { ok: false, error: "id requerido." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .select(
        "id, project_id, status, customer_name, customer_phone, total_cents, currency, meta, created_at, updated_at, items:supply_order_items(id, order_id, product_id, product:supply_products(id, sku, name), qty, unit_price_cents, currency, line_total_cents, created_at)"
      )
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new ApiError(400, { ok: false, error: error.message });
    if (!data?.id) throw new ApiError(404, { ok: false, error: "Orden no encontrada." });

    return json({ ok: true, order: data }, 200);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const id = String(params.id || body.id || "").trim();

    if (!id) throw new ApiError(400, { ok: false, error: "id requerido." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);

    const patch: any = {};
    if (body.status !== undefined) patch.status = String(body.status ?? "").trim();
    if (body.customer_name !== undefined) patch.customer_name = body.customer_name ? String(body.customer_name).trim() : null;
    if (body.customer_phone !== undefined) patch.customer_phone = body.customer_phone ? String(body.customer_phone).trim() : null;
    if (body.meta !== undefined) patch.meta = typeof body.meta === "object" && body.meta !== null ? body.meta : {};

    if (Object.keys(patch).length === 0) {
      throw new ApiError(400, { ok: false, error: "Nada que actualizar." });
    }

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .update(patch)
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("id, project_id, status, customer_name, customer_phone, total_cents, currency, meta, created_at, updated_at")
      .maybeSingle();

    if (error) throw new ApiError(400, { ok: false, error: error.message });
    if (!data?.id) throw new ApiError(404, { ok: false, error: "Orden no encontrada." });

    return json({ ok: true, order: data }, 200);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}
