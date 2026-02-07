import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireProjectRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const project_id = String(body.project_id ?? "global").trim();

  const auth = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const admin = createAdminSupabase();

  const { data: existing } = await admin
    .from("nova_threads")
    .select("id")
    .eq("project_id", project_id)
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing?.[0]?.id) return NextResponse.json({ ok: true, thread_id: existing[0].id });

  const { data: created, error } = await admin
    .from("nova_threads")
    .insert({ project_id, user_id: auth.user.id, title: "NOVA", meta: {} })
    .select("id")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, thread_id: created.id });
}