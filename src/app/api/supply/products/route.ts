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
  const { data, error } = await admin
    .from("supply_products")
    .select("id,project_id,sku,name,description,unit_cost,price,stock,created_at")
    .eq("project_id", project_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, data: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireRole(["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());

  const sku = body.sku ? String(body.sku) : null;
  const name = String(body.name ?? "").trim();
  const description = body.description ? String(body.description) : null;
  const unit_cost = Number(body.unit_cost ?? 0);
  const price = Number(body.price ?? 0);
  const stock = Number(body.stock ?? 0);

  if (!name) return NextResponse.json({ ok: false, error: "Falta name" }, { status: 400 });

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("supply_products")
    .insert({ project_id, sku, name, description, unit_cost, price, stock })
    .select("id")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await admin.from("audit_logs").insert({
    project_id,
    actor_type: "user",
    actor_id: auth.user!.id,
    action: "supply_product_create",
    target: "supply_products",
    meta: { id: data.id, sku, name }
  });

  return NextResponse.json({ ok: true, id: data.id });
}