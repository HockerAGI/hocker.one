import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeProjectId } from "@/lib/project";
import { requireProjectRole } from "@/lib/authz";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { signCommand } from "@/lib/security";

export const runtime = "nodejs";

const ALLOWED = new Set(["status", "fs.list", "fs.read", "fs.write", "shell.exec"]);
const NEEDS_APPROVAL = new Set(["fs.write", "shell.exec"]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));

  const project_id = normalizeProjectId(body.project_id ?? "global");
  const node_id = String(body.node_id ?? "").trim();
  const command = String(body.command ?? "").trim();
  const payload = body.payload ?? {};

  if (!node_id) return NextResponse.json({ ok: false, error: "Falta node_id" }, { status: 400 });
  if (!ALLOWED.has(command)) return NextResponse.json({ ok: false, error: "Comando no permitido" }, { status: 400 });

  const auth = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admin = createAdminSupabase();

  // kill-switch
  const { data: controls } = await admin
    .from("system_controls")
    .select("kill_switch")
    .eq("project_id", project_id)
    .eq("id", "global")
    .maybeSingle();

  if (controls?.kill_switch) {
    return NextResponse.json({ ok: false, error: "Kill-switch activo" }, { status: 503 });
  }

  const secret = process.env.HOCKER_COMMAND_SIGNING_SECRET ?? "";
  if (!secret) return NextResponse.json({ ok: false, error: "Falta HOCKER_COMMAND_SIGNING_SECRET" }, { status: 500 });

  const id = crypto.randomUUID();
  const needs_approval = NEEDS_APPROVAL.has(command);
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

  await admin.from("events").insert({
    project_id,
    node_id,
    level: "info",
    type: "command.created",
    message: needs_approval ? `Comando requiere aprobación: ${command}` : `Comando encolado: ${command}`,
    data: { command_id: id, by: auth.user.id, status }
  });

  return NextResponse.json({ ok: true, id, status, needs_approval });
}