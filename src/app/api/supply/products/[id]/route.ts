import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";

export const runtime = "nodejs";

function asInt(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") || "global").trim();
    const id = String(params.id || "").trim();

    if (!id) throw new ApiError(400, { ok: false, error: "id requerido." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("supply_products")
      .select(
        "id, project_id, sku, name, description, price_cents, cost_cents, currency, stock, active, meta, created_at, updated_at"
      )
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new ApiError(400, { ok: false, error: error.message });
    if (!data?.id) throw new ApiError(404, { ok: false, error: "Producto no encontrado." });

    return json({ ok: true, item: data }, 200);
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

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);

    const patch: any = {};
    if (body.sku !== undefined) patch.sku = body.sku ? String(body.sku).trim() : null;
    if (body.name !== undefined) patch.name = String(body.name ?? "").trim();
    if (body.description !== undefined) patch.description = body.description ? String(body.description).trim() : null;
    if (body.currency !== undefined) patch.currency = String(body.currency ?? "MXN").trim().toUpperCase() || "MXN";
    if (body.price_cents !== undefined || body.price !== undefined) patch.price_cents = asInt(body.price_cents ?? body.price, 0);
    if (body.cost_cents !== undefined || body.cost !== undefined) patch.cost_cents = asInt(body.cost_cents ?? body.cost, 0);
    if (body.stock !== undefined) patch.stock = asInt(body.stock, 0);
    if (body.active !== undefined) patch.active = Boolean(body.active);
    if (body.meta !== undefined) patch.meta = typeof body.meta === "object" && body.meta !== null ? body.meta : {};

    if (patch.name !== undefined && !patch.name) throw new ApiError(400, { ok: false, error: "name inválido." });
    if (patch.price_cents !== undefined && patch.price_cents < 0) throw new ApiError(400, { ok: false, error: "price inválido." });
    if (patch.cost_cents !== undefined && patch.cost_cents < 0) throw new ApiError(400, { ok: false, error: "cost inválido." });

    const { data, error } = await ctx.sb
      .from("supply_products")
      .update(patch)
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select(
        "id, project_id, sku, name, description, price_cents, cost_cents, currency, stock, active, meta, created_at, updated_at"
      )
      .maybeSingle();

    if (error) throw new ApiError(400, { ok: false, error: error.message });
    if (!data?.id) throw new ApiError(404, { ok: false, error: "Producto no encontrado." });

    return json({ ok: true, item: data }, 200);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}
