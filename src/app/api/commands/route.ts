import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { signCommand } from "@/lib/security";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";

const SENSITIVE_COMMANDS = new Set<string>([
  "FS_WRITE",
  "FS_DELETE",
  "EXEC_SHELL",
  "DEPLOY",
  "RESTART_SERVICE",
  "UPDATE_ENV",
  "KILL_SWITCH_ON",
  "KILL_SWITCH_OFF"
]);

async function isKillSwitchOn(admin: ReturnType<typeof createAdminSupabase>, project_id: string) {
  const r = await admin.from("system_controls").select("kill_switch").eq("project_id", project_id).single();
  if (r.error) return false;
  return Boolean(r.data?.kill_switch);
}

export async function POST(req: Request) {
  const admin = createAdminSupabase();
  const body = await req.json().catch(() => ({}));

  const node_id = String(body.node_id ?? "");
  const command = String(body.command ?? "");
  const payload = (body.payload ?? {}) as Record<string, unknown>;
  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());

  if (!node_id || !command) {
    return NextResponse.json({ ok: false, error: "Faltan node_id o command" }, { status: 400 });
  }

  // Auth: members can submit safe commands; only owner/admin for sensitive
  const needsApproval = SENSITIVE_COMMANDS.has(command);

  const auth = await requireRole(needsApproval ? ["owner", "admin"] : ["owner", "admin", "operator"], project_id);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  if (await isKillSwitchOn(admin, auth.project_id)) {
    return NextResponse.json({ ok: false, error: "Kill-switch activo en este proyecto" }, { status: 423 });
  }

  const ts = new Date().toISOString();
  const signature = signCommand({
    node_id,
    command,
    payload,
    project_id: auth.project_id,
    ts
  });

  const status = needsApproval ? "needs_approval" : "queued";

  const ins = await admin
    .from("commands")
    .insert({
      project_id: auth.project_id,
      node_id,
      command,
      payload,
      signature,
      status,
      created_by: auth.user.id
    })
    .select("id,status")
    .single();

  if (ins.error) {
    return NextResponse.json({ ok: false, error: ins.error.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    project_id: auth.project_id,
    actor_id: auth.user.id,
    action: "command_created",
    target: `commands:${ins.data.id}`,
    metadata: { node_id, command, status }
  });

  return NextResponse.json({ ok: true, id: ins.data.id, status: ins.data.status });
}