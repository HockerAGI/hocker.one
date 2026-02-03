import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const admin = createAdminSupabase();
  const body = await req.json().catch(() => ({}));

  const text = String(body.text ?? "");
  const node_id = String(body.node_id ?? process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ?? "node-hocker-01");
  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());
  const thread_id_in = body.thread_id ? String(body.thread_id) : null;

  if (!text) return NextResponse.json({ ok: false, error: "Falta text" }, { status: 400 });

  let thread_id = thread_id_in;

  if (!thread_id) {
    const t = await admin
      .from("nova_threads")
      .insert({ project_id, user_id: data.user.id, title: "NOVA Chat" })
      .select("id")
      .single();

    if (t.error) return NextResponse.json({ ok: false, error: t.error.message }, { status: 400 });
    thread_id = t.data.id;
  }

  const ins1 = await admin.from("nova_messages").insert({ project_id, thread_id, role: "user", content: text });
  if (ins1.error) return NextResponse.json({ ok: false, error: ins1.error.message }, { status: 400 });

  const url = process.env.NOVA_ORCHESTRATOR_URL ?? "";
  const key = process.env.NOVA_ORCHESTRATOR_KEY ?? "";
  if (!url || !key) return NextResponse.json({ ok: false, error: "Falta NOVA_ORCHESTRATOR_URL o KEY" }, { status: 500 });

  const r = await fetch(`${url}/v1/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hocker-key": key },
    body: JSON.stringify({ text, node_id, project_id, user_id: data.user.id, thread_id })
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) return NextResponse.json({ ok: false, error: j?.error ?? "Error NOVA" }, { status: r.status });

  const reply = String(j.reply ?? "");
  if (reply) {
    await admin.from("nova_messages").insert({
      project_id,
      thread_id,
      role: "nova",
      content: reply,
      meta: { action: j.action ?? null, commandId: j.commandId ?? null }
    });
  }

  return NextResponse.json({
    ok: true,
    thread_id,
    reply,
    action: j.action ?? null,
    commandId: j.commandId ?? null
  });
}