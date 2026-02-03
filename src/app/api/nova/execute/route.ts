import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const url = process.env.NOVA_ORCHESTRATOR_URL ?? "";
  const key = process.env.NOVA_ORCHESTRATOR_KEY ?? "";
  if (!url || !key) return NextResponse.json({ ok: false, error: "Falta NOVA_ORCHESTRATOR_URL o KEY" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "");
  const node_id = String(body.node_id ?? process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ?? "node-hocker-01");
  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());
  if (!text) return NextResponse.json({ ok: false, error: "Falta text" }, { status: 400 });

  const r = await fetch(`${url}/v1/execute`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hocker-key": key },
    body: JSON.stringify({ text, node_id, project_id, user_id: data.user.id })
  });

  const j = await r.json().catch(() => ({}));
  return NextResponse.json(j, { status: r.status });
}