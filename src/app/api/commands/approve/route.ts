import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = createAdminSupabase();
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");

  if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

  // Load command with project_id first
  const cmd = await admin
    .from("commands")
    .select("id, project_id, status, node_id, command")
    .eq("id", id)
    .single();

  if (cmd.error || !cmd.data) {
    return NextResponse.json({ ok: false, error: cmd.error?.message ?? "Comando no encontrado" }, { status: 404 });
  }

  const project_id = cmd.data.project_id;

  // AuthZ for that project
  const auth = await requireRole(["owner", "admin"], project_id);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  if (cmd.data.status !== "needs_approval") {
    return NextResponse.json({ ok: false, error: "Este comando no requiere aprobación" }, { status: 409 });
  }

  const upd = await admin
    .from("commands")
    .update({
      status: "queued",
      approved_by: auth.user.id,
      approved_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("id,status")
    .single();

  if (upd.error) {
    return NextResponse.json({ ok: false, error: upd.error.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    project_id: auth.project_id,
    actor_id: auth.user.id,
    action: "command_approved",
    target: `commands:${id}`,
    metadata: { node_id: cmd.data.node_id, command: cmd.data.command }
  });

  return NextResponse.json({ ok: true, id: upd.data.id, status: upd.data.status });
}