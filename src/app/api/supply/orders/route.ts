import { ApiError, getControls, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

function asInt(v: any, def = 0) {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : def;
}

export async function GET(req: Request) {
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .select(`*, items:supply_order_items(*)`)
      .eq("project_id", project_id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new ApiError(500, { error: error.message });
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

    const controls = await getControls(ctx.sb, project_id);
    if (controls.kill_switch) throw new ApiError(423, { error: "Kill Switch ON. Supply bloqueado." });
    if (!controls.allow_write) throw new ApiError(423, { error: "allow_write OFF. Supply en modo lectura." });

    const status = String(body.status || "pending").trim();
    const customer_name = body.customer_name ? String(body.customer_name).trim() : null;
    const customer_phone = body.customer_phone ? String(body.customer_phone).trim() : null;
    const currency = String(body.currency || "MXN").trim().toUpperCase();
    const meta = body.meta && typeof body.meta === "object" ? body.meta : {};

    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    if (!itemsRaw.length) throw new ApiError(400, { error: "Falta items (mínimo 1)." });

    const items = itemsRaw.map((it: any) => {
      const qty = Math.max(1, asInt(it.qty, 1));
      const unit_price_cents = it.unit_price_cents === undefined ? undefined : Math.max(0, asInt(it.unit_price_cents, 0));
      const product_id = it.product_id ? String(it.product_id).trim() : undefined;

      const out: any = { qty };
      if (product_id) out.product_id = product_id;
      if (unit_price_cents !== undefined) out.unit_price_cents = unit_price_cents;
      return out;
    });

    const { data, error } = await ctx.sb.rpc("supply_create_order", {
      p_project_id: project_id,
      p_status: status,
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
      p_currency: currency,
      p_items: items,
      p_meta: meta,
    });

    if (error) throw new ApiError(500, { error: error.message });

    return json({ ok: true, result: data }, 201);
  } catch (e: any) {
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}