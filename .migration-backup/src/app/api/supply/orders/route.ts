import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { getControls, requireProjectRole, ApiError, toApiError, json } from "../../_lib";
import { getErrorMessage } from "@/lib/errors";

export const runtime = "edge";

const OrderSchema = z.object({
  project_id: z.string().min(1),
  idempotency_key: z.string().min(10),
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
  shipping_details: z.record(z.string(), z.any()),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = OrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Estructura de la orden rechazada." },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Identidad no verificada." }, { status: 401 });
    }

    const ctx = await requireProjectRole(payload.project_id, ["owner", "admin", "operator", "viewer"]);
    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      return NextResponse.json({ ok: false, error: "Kill Switch activo." }, { status: 423 });
    }

    if (!controls.allow_write) {
      return NextResponse.json({ ok: false, error: "Modo solo lectura activo." }, { status: 403 });
    }

    const { data: existingOrder } = await ctx.sb
      .from("supply_orders")
      .select("id")
      .eq("project_id", ctx.project_id)
      .eq("idempotency_key", payload.idempotency_key)
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json(
        { ok: true, note: "Orden previamente asegurada.", id: existingOrder.id },
        { status: 200 },
      );
    }

    const { data: newOrder, error: insertError } = await ctx.sb
      .from("supply_orders")
      .insert({
        project_id: ctx.project_id,
        user_id: user.id,
        product_id: payload.product_id,
        quantity: payload.quantity,
        shipping_details: payload.shipping_details,
        idempotency_key: payload.idempotency_key,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: getErrorMessage(insertError) },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, order_id: newOrder.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Falla en el motor de logística." },
      { status: 500 },
    );
  }
}