import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireProjectRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const project_id = String(body.project_id ?? "global").trim();

  const auth = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const node_id = body.node_id ? String(body.node_id) : null;
  const level = String(body.level ?? "info");
  const type = String(body.type ?? "manual.note");
  const message = String(body.message ?? "").trim();
  const data = body.data ?? {};

  if (!message) return NextResponse.json({ ok: false, error: "Falta message" }, { status: 400 });

  const admin = createAdminSupabase();
  const { error } = await admin.from("events").insert({ project_id, node_id, level, type, message, data });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}