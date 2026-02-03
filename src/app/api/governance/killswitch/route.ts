import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireRole(["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const enabled = Boolean(body.enabled);

  const admin = createAdminSupabase();

  await admin.from("system_controls").upsert({ id: "global", kill_switch: enabled, updated_at: new Date().toISOString() });

  await admin.from("audit_logs").insert({
    actor_type: "user",
    actor_id: auth.user!.id,
    action: enabled ? "killswitch_enable" : "killswitch_disable",
    target: "global",
    meta: {}
  });

  await admin.from("events").insert({
    node_id: "cloud-hocker-one",
    level: enabled ? "critical" : "info",
    type: "killswitch",
    message: enabled ? "Kill-switch ACTIVADO" : "Kill-switch DESACTIVADO",
    data: { by: auth.user!.id }
  });

  return NextResponse.json({ ok: true, enabled });
}