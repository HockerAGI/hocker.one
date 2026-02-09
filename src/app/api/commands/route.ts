import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServerSupabase } from "@/lib/supabase-server";
import { signCommand } from "@/lib/security";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

const ALLOWED_NODE_COMMANDS = new Set([
  "ping",
  "restart_process",
  "pull_deploy",
  "run_sql",
  "run_script",
  "write_file",
]);

const SENSITIVE_COMMANDS = new Set([
  "run_sql",
  "run_script",
  "write_file",
]);

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

    const project_id = normalizeProjectId(body?.project_id ?? defaultProjectId());
    const node_id = String(body?.node_id ?? "").trim();
    const command = String(body?.command ?? "").trim();
    const payload = body?.payload ?? {};

    if (!project_id || !node_id || !command) {
      return NextResponse.json({ error: "Faltan project_id, node_id o command." }, { status: 400 });
    }

    if (!ALLOWED_NODE_COMMANDS.has(command)) {
      return NextResponse.json({ error: "Comando no permitido." }, { status: 400 });
    }

    const auth = await requireProjectAdmin(project_id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const sb = auth.sb;

    const secret = (process.env.COMMAND_HMAC_SECRET || "").trim();
    if (!secret) {
      return NextResponse.json({ error: "COMMAND_HMAC_SECRET no está configurado." }, { status: 500 });
    }

    // Lee controls por proyecto (id='global' + project_id)
    const { data: ctrl, error: ctrlErr } = await sb
      .from("system_controls")
      .select("kill_switch, allow_write")
      .eq("project_id", project_id)
      .eq("id", "global")
      .maybeSingle();

    if (ctrlErr) return NextResponse.json({ error: ctrlErr.message }, { status: 500 });

    const kill = !!ctrl?.kill_switch;
    const allowWrite = !!ctrl?.allow_write;

    if (kill) {
      await sb.from("events").insert({
        project_id,
        node_id,
        level: "warn",
        type: "command_blocked",
        message: `Kill-switch activo. Bloqueado: ${command}`,
        data: { payload },
      });
      return NextResponse.json({ error: "Kill-switch activo. Comando bloqueado." }, { status: 423 });
    }

    const isSensitive = SENSITIVE_COMMANDS.has(command);

    // Si no hay allow_write, lo sensible SIEMPRE requiere aprobación
    const needs_approval = isSensitive && !allowWrite;
    const status = needs_approval ? "needs_approval" : "queued";

    const command_id = crypto.randomUUID();
    const signature = signCommand(secret, command_id, project_id, node_id, command, payload);

    const { error: insErr } = await sb.from("commands").insert({
      id: command_id,
      project_id,
      node_id,
      command,
      payload,
      signature,
      needs_approval,
      status,
      created_by: auth.userId,
    });

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    // audit_log (permitido por RLS para admin en schema)
    await sb.from("audit_logs").insert({
      project_id,
      actor_type: "user",
      actor_id: auth.userId,
      action: "create_command",
      target: `command:${command_id}`,
      meta: { node_id, command, needs_approval, status },
    });

    return NextResponse.json({
      ok: true,
      id: command_id,
      project_id,
      status,
      needs_approval,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}