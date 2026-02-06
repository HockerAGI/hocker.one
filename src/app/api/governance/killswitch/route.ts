import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireProjectRole } from "@/lib/authz";
import { normalizeProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? "global");

  const auth = await requireProjectRole(project_id, ["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const kill = body.kill_switch !== undefined ? Boolean(body.kill_switch) : undefined;
  const allow_shell = body.allow_shell !== undefined ? Boolean(body.allow_shell) : undefined;
  const allow_filesystem = body.allow_filesystem !== undefined ? Boolean(body.allow_filesystem) : undefined;

  if (kill === undefined && allow_shell === undefined && allow_filesystem === undefined) {
    return NextResponse.json({ ok: false, error: "No hay cambios" }, { status: 400 });
  }

  const patch: any = { id: "global", project_id, updated_at: new Date().toISOString() };
  if (kill !== undefined) patch.kill_switch = kill;
  if (allow_shell !== undefined) patch.allow_shell = allow_shell;
  if (allow_filesystem !== undefined) patch.allow_filesystem = allow_filesystem;

  const admin = createAdminSupabase();

  await admin.from("system_controls").upsert(patch, { onConflict: "id" });

  await admin.from("audit_logs").insert({
    project_id,
    actor_type: "user",
    actor_id: auth.user.id,
    action: "system_controls.update",
    target: `system_controls:${project_id}`,
    meta: patch
  });

  await admin.from("events").insert({
    project_id,
    node_id: "cloud-hocker-one",
    level: kill ? "critical" : "info",
    type: "system_controls",
    message: `Controles actualizados (kill=${kill ?? "no-change"} shell=${allow_shell ?? "no-change"} fs=${
      allow_filesystem ?? "no-change"
    })`,
    data: { by: auth.user.id }
  });

  return NextResponse.json({ ok: true, project_id, ...patch });
}