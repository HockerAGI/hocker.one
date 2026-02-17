import { NextResponse } from "next/server";
import { ApiError, getControls, json, requireProjectRole } from "@/app/api/_lib";

export const runtime = "nodejs";

const ALLOWED_STATUS = new Set(["pending", "paid", "producing", "shipped", "delivered", "cancelled"]);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const project_id = url.searchParams.get("project_id") || "global";
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
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
      .eq("id", params.id)
      .single();

    if (error) throw new ApiError(404, { error: "Order no encontrada." });

    return NextResponse.json({ ok: true, order: data });
  } catch (e) {
    return json(e);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const project_id = String(body.project_id || "global");

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);

    const controls = await getControls(ctx.sb, project_id);
    if (controls.kill_switch) throw new ApiError(423, { error: "Kill-switch activo. Escrituras bloqueadas." });
    if (!controls.allow_write && ctx.role === "operator") {
      throw new ApiError(423, { error: "Escrituras deshabilitadas (allow_write=false)." });
    }

    const patch: any = {};
    if (body.status != null) {
      const s = String(body.status);
      if (!ALLOWED_STATUS.has(s)) throw new ApiError(400, { error: "status inválido." });
      patch.status = s;
    }
    if (body.customer_name != null) patch.customer_name = String(body.customer_name);
    if (body.customer_phone != null) patch.customer_phone = body.customer_phone ? String(body.customer_phone) : null;
    if (body.meta != null && typeof body.meta === "object") patch.meta = body.meta;

    if (!Object.keys(patch).length) throw new ApiError(400, { error: "Nada que actualizar." });

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .update(patch)
      .eq("project_id", project_id)
      .eq("id", params.id)
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
      .single();

    if (error) throw new ApiError(500, { error: error.message });

    return NextResponse.json({ ok: true, order: data });
  } catch (e) {
    return json(e);
  }
}