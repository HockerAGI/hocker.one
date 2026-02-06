import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireProjectRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

  const admin = createAdminSupabase();

  const { data: cmd, error: cErr } = await admin
    .from("commands")
    .select("id, project_id, status, node_id, command")
    .eq("id", id)
    .maybeSingle();

  if (cErr || !cmd) return NextResponse.json({ ok: false, error: "Comando no encontrado" }, { status: 404 });

  // Permiso por proyecto (no global a ciegas)
  const auth = await requireProjectRole(cmd.project_id, ["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  if (cmd.status !== "needs_approval") {
    return NextResponse.json({ ok: true, already: true, status: cmd.status, project_id: cmd.project_id });
  }

  const { error: uErr } = await admin
    .from("commands")
    .update({ status: "queued", needs_approval: false, approved_by: auth.user.id })
    .eq("id", id);

  if (uErr) return NextResponse.json({ ok: false, error: uErr.message }, { status: 500 });

  await admin.from("audit_logs").insert({
    project_id: cmd.project_id,
    actor_type: "user",
    actor_id: auth.user.id,
    action: "command.approve",
    target: `command:${id}`,
    meta: { node_id: cmd.node_id, command: cmd.command }
  });

  await admin.from("events").insert({
    project_id: cmd.project_id,
    node_id: cmd.node_id,
    level: "info",
    type: "command.approved",
    message: `Comando aprobado: ${cmd.command}`,
    data: { command_id: id, approved_by: auth.user.id }
  });

  return NextResponse.json({ ok: true, id, project_id: cmd.project_id, status: "queued" });
}