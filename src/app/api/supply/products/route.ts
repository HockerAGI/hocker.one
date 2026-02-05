import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const project_id = normalizeProjectId(url.searchParams.get("project_id") ?? defaultProjectId());

  const auth = await requireRole(["owner", "admin", "operator"], project_id);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admin = createAdminSupabase();
  const q = await admin
    .from("supply_products")
    .select("*")
    .eq("project_id", auth.project_id)
    .order("created_at", { ascending: false });

  if (q.error) return NextResponse.json({ ok: false, error: q.error.message }, { status: 400 });
  return NextResponse.json({ ok: true, items: q.data });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());

  const auth = await requireRole(["owner", "admin"], project_id);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admin = createAdminSupabase();

  const ins = await admin.from("supply_products").insert({
    project_id: auth.project_id,
    sku: String(body.sku ?? ""),
    name: String(body.name ?? ""),
    description: body.description ? String(body.description) : null,
    price_cents: Number(body.price_cents ?? 0),
    currency: String(body.currency ?? "MXN"),
    stock: Number(body.stock ?? 0),
    active: Boolean(body.active ?? true),
    meta: body.meta ?? {}
  }).select("*").single();

  if (ins.error) return NextResponse.json({ ok: false, error: ins.error.message }, { status: 400 });
  return NextResponse.json({ ok: true, item: ins.data });
}