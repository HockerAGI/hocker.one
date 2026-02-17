import { NextResponse } from "next/server";
import { ApiError, getControls, json, requireProjectRole } from "@/app/api/_lib";

export const runtime = "nodejs";

function asInt(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const project_id = url.searchParams.get("project_id") || "global";
    const limit = Math.min(Math.max(asInt(url.searchParams.get("limit"), 50), 1), 200);
    const status = url.searchParams.get("status");

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    let q = ctx.sb
      .from("supply_orders")
      .select(
        `
        *,
        items:supply_order_items(
          *,
          product:supply_products(
            id,
            name,
            sku,
            price_cents,
            currency
          )
        )
      `,
      )
      .eq("project_id", project_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) throw new ApiError(500, { error: error.message });

    return NextResponse.json({ ok: true, orders: data || [] });
  } catch (e) {
    return json(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const project_id = String(body.project_id || "global");
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);

    const controls = await getControls(ctx.sb, project_id);
    if (controls.kill_switch) throw new ApiError(423, { error: "Kill-switch activo. Escrituras bloqueadas." });
    if (!controls.allow_write && ctx.role === "operator") {
      throw new ApiError(423, { error: "Escrituras deshabilitadas (allow_write=false)." });
    }

    const customer_name = String(body.customer_name || "").trim();
    if (!customer_name) throw new ApiError(400, { error: "customer_name requerido." });

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) throw new ApiError(400, { error: "items requerido (min 1)." });

    const cleanItems = items
      .map((it: any) => ({
        product_id: String(it.product_id || "").trim(),
        qty: Math.max(1, asInt(it.qty, 1)),
      }))
      .filter((it: any) => it.product_id);

    if (!cleanItems.length) throw new ApiError(400, { error: "items inválidos." });

    const meta = {
      customer_email: body.customer_email ? String(body.customer_email) : null,
      shipping_address: body.shipping_address ? String(body.shipping_address) : null,
      notes: body.notes ? String(body.notes) : null,
      payment_provider: body.payment_provider ? String(body.payment_provider) : null,
      payment_ref: body.payment_ref ? String(body.payment_ref) : null,
      shipping_cents: asInt(body.shipping_cents, 0),
    };

    const currency = body.currency ? String(body.currency) : "MXN";

    const { data: rpcData, error: rpcErr } = await ctx.sb.rpc("supply_create_order", {
      p_project_id: project_id,
      p_status: "pending",
      p_customer_name: customer_name,
      p_customer_phone: body.customer_phone ? String(body.customer_phone) : null,
      p_currency: currency,
      p_items: cleanItems,
      p_meta: meta,
    });

    if (rpcErr) throw new ApiError(500, { error: rpcErr.message });

    const orderId = (rpcData as any)?.order?.id;
    if (!orderId) throw new ApiError(500, { error: "RPC no devolvió order.id" });

    const { data: order, error: oerr } = await ctx.sb
      .from("supply_orders")
      .select(
        `
        *,
        items:supply_order_items(
          *,
          product:supply_products(
            id,
            name,
            sku,
            price_cents,
            currency
          )
        )
      `,
      )
      .eq("project_id", project_id)
      .eq("id", orderId)
      .single();

    if (oerr) throw new ApiError(500, { error: oerr.message });

    return NextResponse.json({ ok: true, order });
  } catch (e) {
    return json(e);
  }
}