import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { z } from "zod";

export const runtime = "edge";

// Blindaje de la estructura de la orden
const OrderSchema = z.object({
  idempotency_key: z.string().min(10),
  product_id: z.string().uuid(),
  quantity: z.number().min(1).default(1),
  shipping_details: z.record(z.string(), z.any())
});

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    
    // Verificación estricta de identidad
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Identidad no verificada." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = OrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Estructura de la orden rechazada." }, { status: 400 });
    }

    const payload = parsed.data;

    // BLOQUEO DE DUPLICIDAD: Verificamos si la orden ya cruzó nuestro sistema
    const { data: existingOrder } = await supabase
      .from("supply_orders")
      .select("id")
      .eq("idempotency_key", payload.idempotency_key)
      .single();

    if (existingOrder) {
      return NextResponse.json(
        { ok: true, note: "Orden previamente asegurada.", id: existingOrder.id },
        { status: 200 }
      );
    }

    // Aprobación e inserción de la nueva orden en logística
    const { data: newOrder, error: insertError } = await supabase
      .from("supply_orders")
      .insert({
        user_id: user.id,
        product_id: payload.product_id,
        quantity: payload.quantity,
        shipping_details: payload.shipping_details,
        idempotency_key: payload.idempotency_key,
        status: "pending"
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ ok: true, order_id: newOrder.id }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Falla en el motor de logística." },
      { status: 500 }
    );
  }
}