import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .select(`
        *,
        items:supply_order_items(*)
      `)
      .eq("project_id", project_id)
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, { error: "Error al cargar las órdenes de compra." });

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

    const customer_name = String(body.customer_name || "").trim();
    const total_cents = parseInt(body.total_cents, 10) || 0;
    
    if (!customer_name) throw new ApiError(400, { error: "Falta el nombre del cliente." });

    // Inserción de la orden principal
    const { data: order, error: orderErr } = await ctx.sb
      .from("supply_orders")
      .insert({
        project_id,
        customer_name,
        customer_phone: body.customer_phone || null,
        total_cents,
        currency: body.currency || "MXN",
        status: body.status || "pending",
        meta: body.meta || {}
      })
      .select("*")
      .single();

    if (orderErr || !order) throw new ApiError(500, { error: "No se pudo crear la orden." });

    // Si enviaron items, los procesamos (Opcional en la misma petición)
    if (Array.isArray(body.items) && body.items.length > 0) {
       const itemsToInsert = body.items.map((item: any) => ({
           order_id: order.id,
           product_id: item.product_id,
           qty: item.qty || 1,
           unit_price_cents: item.unit_price_cents || 0,
           line_total_cents: (item.qty || 1) * (item.unit_price_cents || 0),
           currency: item.currency || "MXN"
       }));
       
       await ctx.sb.from("supply_order_items").insert(itemsToInsert);
    }

    return json({ ok: true, item: order }, 201);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}