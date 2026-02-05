import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = createAdminSupabase();
  const body = await req.json().catch(() => ({}));

  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());
  const level = (String(body.level ?? "info") as "info" | "warn" | "error");
  const message = String(body.message ?? "");

  if (!message) return NextResponse.json({ ok: false, error: "Falta message" }, { status: 400 });

  const auth = await requireRole(["owner", "admin"], project_id);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const ins = await admin.from("events").insert({
    project_id: auth.project_id,
    level,
    message,
    meta: { manual: true }
  });

  if (ins.error) return NextResponse.json({ ok: false, error: ins.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}