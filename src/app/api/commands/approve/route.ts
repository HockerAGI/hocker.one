import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  // rol
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = String(prof?.role ?? "operator");
  if (!["owner", "admin"].includes(role)) {
    return NextResponse.json({ ok: false, error: "No tienes permiso para aprobar" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

  const admin = createAdminSupabase();

  const { data: cmd, error: cErr } = await admin
    .from("commands")
    .select("id, project_id, status, node_id, command")
    .eq("id", id)
    .maybeSingle();

  if (cErr || !cmd) return NextResponse.json({ ok: false, error: "Comando no encontrado" }, { status: 404 });

  if (cmd.status !== "needs_approval") {
    return NextResponse.json({ ok: true, already: true, status: cmd.status, project_id: cmd.project_id });
  }

  const { error: uErr } = await admin
    .from("commands")
    .update({ status: "queued", approved_by: data.user.id })
    .eq("id", id);

  if (uErr) return NextResponse.json({ ok: false, error: uErr.message }, { status: 500 });

  await admin.from("audit_logs").insert({
    project_id: cmd.project_id,
    actor_type: "user",
    actor_id: data.user.id,
    action: "command.approve",
    target_type: "command",
    target_id: id,
    details: { node_id: cmd.node_id, command: cmd.command },
  });

  await admin.from("events").insert({
    project_id: cmd.project_id,
    node_id: cmd.node_id,
    level: "info",
    event_type: "command.approved",
    message: `Comando aprobado: ${cmd.command}`,
    details: { command_id: id, approved_by: data.user.id },
  });

  return NextResponse.json({ ok: true, id, project_id: cmd.project_id, status: "queued" });
}