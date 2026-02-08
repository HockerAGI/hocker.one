import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/authz";
import { normalizeProjectId } from "@/lib/project";

export async function POST(req: Request) {
  const auth = await requireRole("owner");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sb = createAdminSupabase();

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body?.id as string | undefined;
  const requestedProjectId = body?.project_id ? normalizeProjectId(String(body.project_id)) : null;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: cmd, error: cmdErr } = await sb
    .from("commands")
    .select("id,project_id,status,command,node_id,payload")
    .eq("id", id)
    .single();

  if (cmdErr || !cmd) return NextResponse.json({ error: cmdErr?.message ?? "Command not found" }, { status: 404 });

  const project_id = normalizeProjectId(cmd.project_id);

  if (requestedProjectId && requestedProjectId !== project_id) {
    return NextResponse.json({ error: "Project mismatch" }, { status: 409 });
  }

  const { error: upErr } = await sb.from("commands").update({ status: "rejected" }).eq("id", id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  await sb.from("audit_logs").insert({
    project_id,
    actor_id: auth.userId,
    action: "reject_command",
    meta: { command_id: id, command: cmd.command, node_id: cmd.node_id, payload: cmd.payload ?? null },
  });

  return NextResponse.json({ ok: true, project_id });
}