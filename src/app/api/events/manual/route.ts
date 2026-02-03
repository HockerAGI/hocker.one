import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const node_id = String(body.node_id ?? "");
    const level = String(body.level ?? "info");
    const type = String(body.type ?? "manual");
    const message = String(body.message ?? "");

    if (!message) return NextResponse.json({ ok: false, error: "Falta message" }, { status: 400 });

    const admin = createAdminSupabase();

    const { error } = await admin.from("events").insert({
      node_id: node_id || null,
      level,
      type,
      message,
      data: { by: data.user.id }
    });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    await admin.from("audit_logs").insert({
      actor_type: "user",
      actor_id: data.user.id,
      action: "create_manual_event",
      target: node_id ? `node:${node_id}` : "global",
      meta: { level, type }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 500 });
  }
}