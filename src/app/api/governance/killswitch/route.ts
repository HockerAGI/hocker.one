import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = createAdminSupabase();
  const body = await req.json().catch(() => ({}));

  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());
  const action = String(body.action ?? "");

  const auth = await requireRole(["owner", "admin"], project_id);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const kill_switch = action === "on";

  const up = await admin
    .from("system_controls")
    .upsert({ project_id: auth.project_id, kill_switch, updated_at: new Date().toISOString() }, { onConflict: "project_id" })
    .select("project_id, kill_switch, updated_at")
    .single();

  if (up.error) return NextResponse.json({ ok: false, error: up.error.message }, { status: 400 });

  await admin.from("audit_logs").insert({
    project_id: auth.project_id,
    actor_id: auth.user.id,
    action: kill_switch ? "killswitch_on" : "killswitch_off",
    target: `system_controls:${auth.project_id}`,
    metadata: {}
  });

  return NextResponse.json({ ok: true, ...up.data });
}