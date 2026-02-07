import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireProjectRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const id = String(body.id ?? "").trim();
  const project_id = String(body.project_id ?? "global").trim();

  if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

  const auth = await requireProjectRole(project_id, ["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admin = createAdminSupabase();

  const { data: cmd } = await admin.from("commands").select("status, node_id, command").eq("id", id).maybeSingle();
  if (!cmd) return NextResponse.json({ ok: false, error: "Comando no encontrado" }, { status: 404 });

  if (cmd.status !== "needs_approval") return NextResponse.json({ ok: true, already: true, status: cmd.status });

  const { error } = await admin
    .from("commands")
    .update({ status: "queued", needs_approval: false, approved_by: auth.user.id })
    .eq("id", id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await admin.from("events").insert({
    project_id,
    node_id: cmd.node_id,
    level: "info",
    type: "command.approved",
    message: `Comando aprobado: ${cmd.command}`,
    data: { command_id: id, by: auth.user.id }
  });

  return NextResponse.json({ ok: true });
}