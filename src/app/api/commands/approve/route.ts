import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireRole(["owner", "admin"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });

  const admin = createAdminSupabase();

  const { data: cmd, error: readErr } = await admin.from("commands").select("id,status,node_id,command").eq("id", id).single();
  if (readErr) return NextResponse.json({ ok: false, error: readErr.message }, { status: 400 });
  if (cmd.status !== "needs_approval") return NextResponse.json({ ok: false, error: "Ese comando no requiere aprobación." }, { status: 409 });

  const { error } = await admin.from("commands").update({ status: "queued" }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await admin.from("audit_logs").insert({
    actor_type: "user",
    actor_id: auth.user!.id,
    action: "approve_command",
    target: `node:${cmd.node_id}`,
    meta: { id: cmd.id, command: cmd.command }
  });

  return NextResponse.json({ ok: true });
}