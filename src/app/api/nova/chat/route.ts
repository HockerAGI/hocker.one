import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireProjectRole } from "@/lib/authz";
import { normalizeProjectId } from "@/lib/project";

export const runtime = "nodejs";

async function callOrchestrator(input: { project_id: string; node_id: string; text: string; user_id: string }) {
  const url = process.env.NOVA_ORCHESTRATOR_URL ?? "";
  const key = process.env.NOVA_ORCHESTRATOR_KEY ?? "";
  if (!url || !key) throw new Error("Falta NOVA_ORCHESTRATOR_URL o NOVA_ORCHESTRATOR_KEY");

  const r = await fetch(`${url.replace(/\/$/, "")}/v1/chat`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hocker-key": key
    },
    body: JSON.stringify(input)
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error ?? `Orchestrator error ${r.status}`);
  return j;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? "global");

  const auth = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const thread_id = String(body.thread_id ?? "").trim();
  const node_id = String(body.node_id ?? "node-hocker-01").trim();
  const text = String(body.text ?? "").trim();

  if (!thread_id) return NextResponse.json({ ok: false, error: "Falta thread_id" }, { status: 400 });
  if (!text) return NextResponse.json({ ok: false, error: "Falta text" }, { status: 400 });

  const admin = createAdminSupabase();

  // Verifica que el thread sea del usuario y proyecto
  const { data: th } = await admin
    .from("nova_threads")
    .select("id, user_id, project_id")
    .eq("id", thread_id)
    .maybeSingle();

  if (!th || th.user_id !== auth.user.id || th.project_id !== project_id) {
    return NextResponse.json({ ok: false, error: "Thread inválido" }, { status: 403 });
  }

  // Guarda mensaje user
  await admin.from("nova_messages").insert({
    thread_id,
    project_id,
    user_id: auth.user.id,
    role: "user",
    content: text,
    meta: { node_id }
  });

  // Llama orchestrator
  let out: any;
  try {
    out = await callOrchestrator({ project_id, node_id, text, user_id: auth.user.id });
  } catch (e: any) {
    await admin.from("nova_messages").insert({
      thread_id,
      project_id,
      user_id: auth.user.id,
      role: "system",
      content: `Error Orchestrator: ${String(e?.message ?? e)}`,
      meta: {}
    });
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }

  const reply = String(out?.reply ?? "Ok.");

  // Guarda respuesta NOVA
  await admin.from("nova_messages").insert({
    thread_id,
    project_id,
    user_id: auth.user.id,
    role: "nova",
    content: reply,
    meta: { orchestrator: true, raw: out }
  });

  return NextResponse.json({ ok: true, reply });
}