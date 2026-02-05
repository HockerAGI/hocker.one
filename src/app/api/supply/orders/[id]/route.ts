import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const url = new URL(req.url);
  const project_id = normalizeProjectId(url.searchParams.get("project_id") ?? defaultProjectId());

  const auth = await requireRole(["owner", "admin", "operator"], project_id);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admin = createAdminSupabase();
  const q = await admin
    .from("supply_orders")
    .select("*")
    .eq("project_id", auth.project_id)
    .eq("id", ctx.params.id)
    .single();

  if (q.error) return NextResponse.json({ ok: false, error: q.error.message }, { status: 404 });
  return NextResponse.json({ ok: true, item: q.data });
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());

  const auth = await requireRole(["owner", "admin"], project_id);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admin = createAdminSupabase();

  const upd = await admin
    .from("supply_orders")
    .update({
      customer_name: body.customer_name != null ? String(body.customer_name) : undefined,
      customer_phone: body.customer_phone != null ? String(body.customer_phone) : undefined,
      status: body.status != null ? String(body.status) : undefined,
      total_cents: body.total_cents != null ? Number(body.total_cents) : undefined,
      currency: body.currency != null ? String(body.currency) : undefined,
      items: body.items != null ? body.items : undefined,
      meta: body.meta != null ? body.meta : undefined,
      updated_at: new Date().toISOString()
    })
    .eq("project_id", auth.project_id)
    .eq("id", ctx.params.id)
    .select("*")
    .single();

  if (upd.error) return NextResponse.json({ ok: false, error: upd.error.message }, { status: 400 });
  return NextResponse.json({ ok: true, item: upd.data });
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  const url = new URL(req.url);
  const project_id = normalizeProjectId(url.searchParams.get("project_id") ?? defaultProjectId());

  const auth = await requireRole(["owner", "admin"], project_id);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admin = createAdminSupabase();
  const del = await admin
    .from("supply_orders")
    .delete()
    .eq("project_id", auth.project_id)
    .eq("id", ctx.params.id);

  if (del.error) return NextResponse.json({ ok: false, error: del.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}