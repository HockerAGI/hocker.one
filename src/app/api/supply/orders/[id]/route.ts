import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/authz";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["owner", "admin", "operator"]);
  if (!user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const admin = createAdminSupabase();
  const id = String(params.id ?? "");

  // por defecto: global (para no romper)
  const project_id = normalizeProjectId(defaultProjectId());

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
  const user = await requireRole(["owner", "admin", "operator"]);
  if (!user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const admin = createAdminSupabase();
  const id = String(params.id ?? "");
  const body = await req.json().catch(() => ({}));

  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());
  const patch: any = {};
  if (body.status) patch.status = String(body.status);
  if (body.customer_name !== undefined) patch.customer_name = String(body.customer_name ?? "");
  if (body.customer_phone !== undefined) patch.customer_phone = String(body.customer_phone ?? "");
  if (body.meta !== undefined) patch.meta = body.meta ?? {};
  patch.updated_at = new Date().toISOString();

  const { error } = await admin
    .from("supply_orders")
    .update(patch)
    .eq("project_id", project_id)
    .eq("id", id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await requireRole(["owner", "admin"]);
  if (!user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const admin = createAdminSupabase();
  const id = String(params.id ?? "");
  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());

  // cancelación suave (mejor que borrar)
  const { error } = await admin
    .from("supply_orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("project_id", project_id)
    .eq("id", id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, cancelled: true });
}