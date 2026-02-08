import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { createAdminSupabase } from "@/lib/supabase-admin";
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

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());
    const node_id = (body.node_id ?? "").toString().trim();
    const command = (body.command ?? "").toString().trim();
    const payload = body.payload ?? null;

    if (!project_id || !node_id || !command) {
      return NextResponse.json(
        { error: "Faltan project_id, node_id o command." },
        { status: 400 }
      );
    }

    if (!ALLOWED_NODE_COMMANDS.has(command)) {
      return NextResponse.json({ error: "Comando no permitido." }, { status: 400 });
    }

    // Solo owner/admin pueden emitir comandos
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    const role = (prof?.role ?? "operator").toString();
    if (!["owner", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Permisos insuficientes." },
        { status: 403 }
      );
    }

    // Kill switch global (por proyecto)
    const sbAdmin = createAdminSupabase();
    const { data: ctrl } = await sbAdmin
      .from("system_controls")
      .select("kill_switch, allow_write")
      .eq("project_id", project_id)
      .eq("id", "global")
      .maybeSingle();

    const kill = !!ctrl?.kill_switch;
    const allowWrite = !!ctrl?.allow_write;

    if (kill) {
      await sbAdmin.from("events").insert({
        project_id,
        node_id,
        level: "warn",
        type: "command_blocked",
        message: `Kill-switch activo. Bloqueado: ${command}`,
        data: { payload },
      });

      return NextResponse.json(
        { error: "Kill-switch activo. Comando bloqueado." },
        { status: 423 }
      );
    }

    if (!allowWrite && SENSITIVE_COMMANDS.has(command)) {
      const needsApproval = true;

      const command_id = crypto.randomUUID();
      const signature = signCommand(
        process.env.COMMAND_HMAC_SECRET!,
        command_id,
        project_id,
        node_id,
        command,
        payload
      );

      const { error: insErr } = await sbAdmin.from("commands").insert({
        id: command_id,
        project_id,
        node_id,
        command,
        payload,
        signature,
        needs_approval: needsApproval,
        status: "needs_approval",
        created_by: userId,
      });

      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }

      await sbAdmin.from("audit_logs").insert({
        project_id,
        actor_type: "user",
        actor_id: userId,
        action: "create_command_needs_approval",
        target: `command:${command_id}`,
        meta: { node_id, command },
      });

      return NextResponse.json({
        ok: true,
        id: command_id,
        project_id,
        status: "needs_approval",
        needs_approval: true,
      });
    }

    // Normal flow (queued)
    const command_id = crypto.randomUUID();
    const signature = signCommand(
      process.env.COMMAND_HMAC_SECRET!,
      command_id,
      project_id,
      node_id,
      command,
      payload
    );

    const needs_approval = SENSITIVE_COMMANDS.has(command);

    const { error: insErr } = await sbAdmin.from("commands").insert({
      id: command_id,
      project_id,
      node_id,
      command,
      payload,
      signature,
      needs_approval,
      status: needs_approval ? "needs_approval" : "queued",
      created_by: userId,
    });

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    await sbAdmin.from("audit_logs").insert({
      project_id,
      actor_type: "user",
      actor_id: userId,
      action: "create_command",
      target: `command:${command_id}`,
      meta: { node_id, command, needs_approval },
    });

    return NextResponse.json({
      ok: true,
      id: command_id,
      project_id,
      status: needs_approval ? "needs_approval" : "queued",
      needs_approval,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}