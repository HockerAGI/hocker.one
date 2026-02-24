import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("supply_products")
      .select("*")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, { error: "Error al cargar el catálogo de productos." });

    return json({ ok: true, items: data ?? [] });
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "").trim();
    
    if (!project_id) throw new ApiError(400, { error: "project_id es requerido." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);

    const name = String(body.name || "").trim();
    const price_cents = parseInt(body.price_cents, 10) || 0;
    const currency = String(body.currency || "MXN").trim().toUpperCase();
    const active = body.active !== undefined ? !!body.active : true;

    if (!name) throw new ApiError(400, { error: "El nombre del producto es obligatorio." });

    const { data, error } = await ctx.sb
      .from("supply_products")
      .insert({
        project_id,
        name,
        description: body.description || null,
        price_cents,
        currency,
        sku: body.sku || null,
        active,
        meta: body.meta || {}
      })
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: "Fallo al registrar el producto." });

    return json({ ok: true, item: data }, 201);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}