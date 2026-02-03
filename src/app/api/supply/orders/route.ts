import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/authz";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireRole(["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const project_id = normalizeProjectId(url.searchParams.get("project_id") ?? defaultProjectId());

  const admin = createAdminSupabase();

  const { data: orders, error: e1 } = await admin
    .from("supply_orders")
    .select("id,project_id,status,customer_name,customer_phone,total,meta,created_at")
    .eq("project_id", project_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (e1) return NextResponse.json({ ok: false, error: e1.message }, { status: 400 });

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: items, error: e2 } = orderIds.length
    ? await admin
        .from("supply_order_items")
        .select("id,order_id,product_id,qty,unit_price,created_at")
        .eq("project_id", project_id)
        .in("order_id", orderIds)
    : { data: [], error: null };

  if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 400 });

  return NextResponse.json({ ok: true, orders: orders ?? [], items: items ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireRole(["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());

  const customer_name = body.customer_name ? String(body.customer_name) : null;
  const customer_phone = body.customer_phone ? String(body.customer_phone) : null;
  const status = String(body.status ?? "pending");

  const items = Array.isArray(body.items) ? body.items : [];
  // items: [{ product_id, qty, unit_price }]
  if (items.length === 0) return NextResponse.json({ ok: false, error: "Faltan items" }, { status: 400 });

  const admin = createAdminSupabase();

  // calcular total
  let total = 0;
  for (const it of items) {
    const qty = Number(it.qty ?? 0);
    const unit_price = Number(it.unit_price ?? 0);
    if (qty <= 0) return NextResponse.json({ ok: false, error: "qty inválido" }, { status: 400 });
    total += qty * unit_price;
  }

  const o = await admin
    .from("supply_orders")
    .insert({ project_id, status, customer_name, customer_phone, total })
    .select("id")
    .single();

  if (o.error) return NextResponse.json({ ok: false, error: o.error.message }, { status: 400 });

  const order_id = o.data.id;

  const rows = items.map((it: any) => ({
    project_id,
    order_id,
    product_id: it.product_id ? String(it.product_id) : null,
    qty: Number(it.qty ?? 1),
    unit_price: Number(it.unit_price ?? 0)
  }));

  const ins = await admin.from("supply_order_items").insert(rows);
  if (ins.error) return NextResponse.json({ ok: false, error: ins.error.message }, { status: 400 });

  await admin.from("audit_logs").insert({
    project_id,
    actor_type: "user",
    actor_id: auth.user!.id,
    action: "supply_order_create",
    target: `supply_orders:${order_id}`,
    meta: { total, items: rows.length }
  });

  return NextResponse.json({ ok: true, id: order_id });
}