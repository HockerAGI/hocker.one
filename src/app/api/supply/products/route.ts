import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

function asInt(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function GET(req: Request) {
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();
    const onlyActive = q.get("active") === "1";
    const search = String(q.get("q") || "").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    let query = ctx.sb
      .from("supply_products")
      .select(
        "id, project_id, sku, name, description, price_cents, cost_cents, currency, stock, active, meta, created_at, updated_at"
      )
      .eq("project_id", ctx.project_id)
      .order("created_at", { ascending: false });

    if (onlyActive) query = query.eq("active", true);

    if (search) {
      query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw new ApiError(400, { ok: false, error: error.message });

    return json({ ok: true, items: data ?? [] }, 200);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);

    const sku = body.sku ? String(body.sku).trim() : null;
    const name = String(body.name ?? "").trim();
    const description = body.description ? String(body.description).trim() : null;
    const currency = String(body.currency ?? "MXN").trim().toUpperCase() || "MXN";

    const price_cents = asInt(body.price_cents ?? body.price ?? 0, 0);
    const cost_cents = asInt(body.cost_cents ?? body.cost ?? 0, 0);
    const stock = asInt(body.stock ?? 0, 0);
    const active = body.active === undefined ? true : Boolean(body.active);

    if (!name) throw new ApiError(400, { ok: false, error: "name requerido." });
    if (price_cents < 0 || cost_cents < 0) throw new ApiError(400, { ok: false, error: "price/cost inválidos." });

    const meta = typeof body.meta === "object" && body.meta !== null ? body.meta : {};

    const { data, error } = await ctx.sb
      .from("supply_products")
      .insert({
        project_id: ctx.project_id,
        sku,
        name,
        description,
        price_cents,
        cost_cents,
        currency,
        stock,
        active,
        meta,
      })
      .select(
        "id, project_id, sku, name, description, price_cents, cost_cents, currency, stock, active, meta, created_at, updated_at"
      )
      .single();

    if (error) throw new ApiError(400, { ok: false, error: error.message });

    return json({ ok: true, item: data }, 201);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}
