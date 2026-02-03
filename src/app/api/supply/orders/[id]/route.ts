import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/authz";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  const auth = await requireRole(["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());

  const patch: any = {};
  if (body.status !== undefined) patch.status = String(body.status);
  if (body.customer_name !== undefined) patch.customer_name = body.customer_name ? String(body.customer_name) : null;
  if (body.customer_phone !== undefined) patch.customer_phone = body.customer_phone ? String(body.customer_phone) : null;
  if (body.meta !== undefined) patch.meta = body.meta ?? {};

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("supply_orders")
    .update(patch)
    .eq("project_id", project_id)
    .eq("id", ctx.params.id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await admin.from("audit_logs").insert({
    project_id,
    actor_type: "user",
    actor_id: auth.user!.id,
    action: "supply_order_update",
    target: `supply_orders:${ctx.params.id}`,
    meta: { patch: Object.keys(patch) }
  });

  return NextResponse.json({ ok: true });
}