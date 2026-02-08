import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/authz";
import { normalizeProjectId } from "@/lib/project";

export async function POST(req: Request) {
  const auth = await requireRole("owner");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const id = (body?.id ?? "").toString();

    if (!id) {
      return NextResponse.json({ error: "Falta id." }, { status: 400 });
    }

    const sb = createAdminSupabase();

    const { data: cmd, error: cmdErr } = await sb
      .from("commands")
      .select("id, project_id, status, needs_approval, command, node_id")
      .eq("id", id)
      .single();

    if (cmdErr || !cmd) {
      return NextResponse.json({ error: "Comando no encontrado." }, { status: 404 });
    }

    const cmdProject = normalizeProjectId(cmd.project_id);
    const requestProject = normalizeProjectId(body?.project_id);
    if (requestProject && requestProject !== cmdProject) {
      return NextResponse.json(
        { error: "project_id no coincide con el comando." },
        { status: 400 }
      );
    }

    if (cmd.status !== "needs_approval" || !cmd.needs_approval) {
      return NextResponse.json(
        { error: "Este comando no está esperando aprobación." },
        { status: 409 }
      );
    }

    const { error: upErr } = await sb
      .from("commands")
      .update({
        status: "cancelled",
        error: "Rejected by owner",
      })
      .eq("id", id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await sb.from("audit_logs").insert({
      project_id: cmdProject,
      actor_type: "user",
      actor_id: auth.userId,
      action: "reject_command",
      target: `command:${id}`,
      meta: {
        command: cmd.command,
        node_id: cmd.node_id,
      },
    });

    return NextResponse.json({ ok: true, id, project_id: cmdProject });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}