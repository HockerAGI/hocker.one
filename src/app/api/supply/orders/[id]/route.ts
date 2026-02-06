import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireProjectRole } from "@/lib/authz";
import { normalizeProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const project_id = normalizeProjectId(url.searchParams.get("project_id") ?? "global");

  const auth = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const id = String(params.id ?? "");
  const admin = createAdminSupabase();

  const { data: order, error: oErr } = await admin
    .from("supply_orders")
    .select("*")
    .eq("project_id", project_id)
    .eq("id", id)
    .maybeSingle();

  if (oErr || !order) return NextResponse.json({ ok: false, error: "Orden no encontrada" }, { status: 404 });

  const { data: items } = await admin
    .from("supply_order_items")
    .select("*")
    .eq("project_id", project_id)
    .eq("order_id", id);

  return NextResponse.json({ ok: true, order, items: items ?? [] });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? "global");

  const auth = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admin = createAdminSupabase();
  const id = String(params.id ?? "");

  const patch: any = {};
  if (body.status) patch.status = String(body.status);
  if (body.customer_name !== undefined) patch.customer_name = String(body.customer_name ?? "");
  if (body.customer_phone !== undefined) patch.customer_phone = String(body.customer_phone ?? "");
  if (body.meta !== undefined) patch.meta = body.meta ?? {};
  patch.updated_at = new Date().toISOString();

  const { error } = await admin.from("supply_orders").update(patch).eq("project_id", project_id).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? "global");

  const auth = await requireProjectRole(project_id, ["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admin = createAdminSupabase();
  const id = String(params.id ?? "");

  const { error } = await admin
    .from("supply_orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("project_id", project_id)
    .eq("id", id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, cancelled: true });
}