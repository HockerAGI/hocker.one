import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireProjectRole } from "@/lib/authz";
import { normalizeProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? "global");

  const auth = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const node_id = body.node_id ? String(body.node_id) : null;
  const level = String(body.level ?? "info");
  const type = String(body.type ?? "manual.note");
  const message = String(body.message ?? "");
  const data = body.data ?? {};

  const admin = createAdminSupabase();

  const { error } = await admin.from("events").insert({ project_id, node_id, level, type, message, data });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await admin.from("audit_logs").insert({
    project_id,
    actor_type: "user",
    actor_id: auth.user.id,
    action: "event.manual",
    target: "events",
    meta: { node_id, level, type }
  });

  return NextResponse.json({ ok: true });
}