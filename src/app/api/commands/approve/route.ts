import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeProjectId } from "@/lib/project";

export const runtime = "nodejs";

async function requireProjectAdmin(project_id: string) {
  const sb = createServerSupabase();
  const { data } = await sb.auth.getUser();
  const userId = data?.user?.id;
  if (!userId) return { ok: false as const, status: 401, error: "No autorizado" };

  const { data: pm, error: pmErr } = await sb
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (pmErr) return { ok: false as const, status: 500, error: pmErr.message };
  const role = String(pm?.role ?? "");
  if (!role) return { ok: false as const, status: 403, error: "No eres miembro del proyecto." };
  if (!["owner", "admin"].includes(role)) {
    return { ok: false as const, status: 403, error: "Permisos insuficientes (admin/owner)." };
  }

  return { ok: true as const, sb, userId, role };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? "").trim();
    if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });

    const project_id = normalizeProjectId(body?.project_id ?? "global");

    const auth = await requireProjectAdmin(project_id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const sb = auth.sb;

    const { data: cmd, error: cmdErr } = await sb
      .from("commands")
      .select("id, project_id, status, needs_approval, command, node_id")
      .eq("id", id)
      .single();

    if (cmdErr || !cmd) return NextResponse.json({ error: "Comando no encontrado." }, { status: 404 });

    const cmdProject = normalizeProjectId(cmd.project_id);
    if (cmdProject !== project_id) {
      return NextResponse.json({ error: "project_id no coincide con el comando." }, { status: 400 });
    }

    if (cmd.status !== "needs_approval" || !cmd.needs_approval) {
      return NextResponse.json({ error: "Este comando no está esperando aprobación." }, { status: 409 });
    }

    const now = new Date().toISOString();

    const { error: upErr } = await sb
      .from("commands")
      .update({ status: "queued", approved_at: now, error: null })
      .eq("id", id);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    await sb.from("audit_logs").insert({
      project_id,
      actor_type: "user",
      actor_id: auth.userId,
      action: "approve_command",
      target: `command:${id}`,
      meta: { command: cmd.command, node_id: cmd.node_id },
    });

    return NextResponse.json({ ok: true, id, project_id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}