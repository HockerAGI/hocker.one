import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { signCommand } from "@/lib/security";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

const ALLOWED_NODE_COMMANDS = new Set([
  "ping",
  "status",
  "read_dir",
  "read_file_head",
  "write_file",
]);

const SENSITIVE_COMMANDS = new Set([
  "read_dir",
  "read_file_head",
  "write_file",
]);

async function isKillSwitchOn(admin: ReturnType<typeof createAdminSupabase>, project_id: string) {
  const { data, error } = await admin
    .from("system_controls")
    .select("kill_switch")
    .eq("id", "global")
    .eq("project_id", project_id)
    .single();

  if (error) return false;
  return !!data?.kill_switch;
}

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    const role = profile?.role ?? "operator";
    if (!["owner", "admin"].includes(role)) {
      return NextResponse.json({ ok: false, error: "Permisos insuficientes" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const node_id = String(body.node_id ?? "");
    const command = String(body.command ?? "");
    const payload = body.payload ?? {};
    const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());

    if (!node_id || !command) return NextResponse.json({ ok: false, error: "Faltan node_id o command" }, { status: 400 });
    if (!ALLOWED_NODE_COMMANDS.has(command)) {
      return NextResponse.json({ ok: false, error: `Comando no permitido: ${command}` }, { status: 400 });
    }

    const secret = process.env.HOCKER_COMMAND_SIGNING_SECRET ?? "";
    if (!secret) return NextResponse.json({ ok: false, error: "Falta HOCKER_COMMAND_SIGNING_SECRET" }, { status: 500 });

    const admin = createAdminSupabase();

    if (await isKillSwitchOn(admin, project_id)) {
      await admin.from("events").insert({
        project_id,
        type: "killswitch",
        severity: "critical",
        message: "Kill-switch activo: comando bloqueado",
        meta: { node_id, command },
      });

      return NextResponse.json({ ok: false, error: "Kill-switch activo. Ejecución bloqueada." }, { status: 423 });
    }

    const id = crypto.randomUUID();
    const signature = signCommand(secret, { id, node_id, command, payload });

    const needs_approval = SENSITIVE_COMMANDS.has(command);
    const status = needs_approval ? "needs_approval" : "queued";

    await admin.from("nodes").upsert({ id: node_id, project_id, name: node_id, type: "local", status: "unknown" });

    const { error } = await admin.from("commands").insert({
      id,
      project_id,
      node_id,
      command,
      payload,
      signature,
      status,
      needs_approval,
      created_by: data.user.id,
    });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    await admin.from("audit_logs").insert({
      project_id,
      actor_type: "user",
      actor_id: data.user.id,
      action: "enqueue_command",
      target: `node:${node_id}`,
      meta: { id, command, status, needs_approval },
    });

    return NextResponse.json({ ok: true, id, status, project_id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 500 });
  }
}