import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/authz";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const auth = await requireRole(["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const project_id = normalizeProjectId(url.searchParams.get("project_id") ?? defaultProjectId());

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("supply_products")
    .select("*")
    .eq("project_id", project_id)
    .eq("id", ctx.params.id)
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
  return NextResponse.json({ ok: true, data });
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  const auth = await requireRole(["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());

  const patch: any = {};
  if (body.sku !== undefined) patch.sku = body.sku ? String(body.sku) : null;
  if (body.name !== undefined) patch.name = String(body.name ?? "").trim();
  if (body.description !== undefined) patch.description = body.description ? String(body.description) : null;
  if (body.unit_cost !== undefined) patch.unit_cost = Number(body.unit_cost ?? 0);
  if (body.price !== undefined) patch.price = Number(body.price ?? 0);
  if (body.stock !== undefined) patch.stock = Number(body.stock ?? 0);

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("supply_products")
    .update(patch)
    .eq("project_id", project_id)
    .eq("id", ctx.params.id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await admin.from("audit_logs").insert({
    project_id,
    actor_type: "user",
    actor_id: auth.user!.id,
    action: "supply_product_update",
    target: `supply_products:${ctx.params.id}`,
    meta: { patch: Object.keys(patch) }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  const auth = await requireRole(["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const project_id = normalizeProjectId(url.searchParams.get("project_id") ?? defaultProjectId());

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("supply_products")
    .delete()
    .eq("project_id", project_id)
    .eq("id", ctx.params.id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await admin.from("audit_logs").insert({
    project_id,
    actor_type: "user",
    actor_id: auth.user!.id,
    action: "supply_product_delete",
    target: `supply_products:${ctx.params.id}`,
    meta: {}
  });

  return NextResponse.json({ ok: true });
}