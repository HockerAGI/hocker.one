import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireProjectRole } from "@/lib/authz";
import { normalizeProjectId } from "@/lib/project";
import { signCommand } from "@/lib/security";

export const runtime = "nodejs";

const ALLOWED_NODE_COMMANDS = new Set([
  "status",
  "fs.list",
  "fs.read",
  "fs.write",
  "shell.exec"
]);

const ALWAYS_NEEDS_APPROVAL = new Set([
  "shell.exec",
  "fs.write"
]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? "global");
  const node_id = String(body.node_id ?? "").trim();
  const command = String(body.command ?? "").trim();
  const payload = body.payload ?? {};

  if (!node_id) return NextResponse.json({ ok: false, error: "Falta node_id" }, { status: 400 });
  if (!command) return NextResponse.json({ ok: false, error: "Falta command" }, { status: 400 });

  // Permiso por proyecto
  const auth = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  if (!ALLOWED_NODE_COMMANDS.has(command)) {
    return NextResponse.json(
      { ok: false, error: `Comando no permitido: ${command}` },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();

  const { data: controls } = await admin
    .from("system_controls")
    .select("kill_switch")
    .eq("project_id", project_id)
    .eq("id", "global")
    .maybeSingle();

  if (controls?.kill_switch) {
    return NextResponse.json({ ok: false, error: "Kill-switch activo (proyecto apagado)" }, { status: 503 });
  }

  const secret = process.env.HOCKER_COMMAND_SIGNING_SECRET ?? "";
  if (!secret) return NextResponse.json({ ok: false, error: "Falta HOCKER_COMMAND_SIGNING_SECRET" }, { status: 500 });

  const id = randomUUID();
  const needs_approval = ALWAYS_NEEDS_APPROVAL.has(command);
  const status = needs_approval ? "needs_approval" : "queued";

  const signature = signCommand(secret, { id, project_id, node_id, command, payload });

  const { error } = await admin.from("commands").insert({
    id,
    project_id,
    node_id,
    command,
    payload,
    status,
    needs_approval,
    signature,
    created_by: auth.user.id
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await admin.from("audit_logs").insert({
    project_id,
    actor_type: "user",
    actor_id: auth.user.id,
    action: "command.create",
    target: `command:${id}`,
    meta: { node_id, command, needs_approval }
  });

  await admin.from("events").insert({
    project_id,
    node_id,
    level: "info",
    type: "command.created",
    message: needs_approval ? `Comando creado (requiere aprobación): ${command}` : `Comando encolado: ${command}`,
    data: { command_id: id, created_by: auth.user.id, status }
  });

  return NextResponse.json({ ok: true, id, project_id, node_id, status, needs_approval });
}