import { NextResponse } from "next/server";
import { requireProjectRole } from "@/lib/authz";
import { normalizeProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const project_id = normalizeProjectId(body.project_id ?? "global");

  const auth = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const text = String(body.text ?? "").trim();
  const node_id = String(body.node_id ?? "node-hocker-01").trim();
  if (!text) return NextResponse.json({ ok: false, error: "Falta text" }, { status: 400 });

  const url = process.env.NOVA_ORCHESTRATOR_URL ?? "";
  const key = process.env.NOVA_ORCHESTRATOR_KEY ?? "";
  if (!url || !key) return NextResponse.json({ ok: false, error: "Falta URL/KEY orchestrator" }, { status: 500 });

  const r = await fetch(`${url.replace(/\/$/, "")}/v1/execute`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hocker-key": key },
    body: JSON.stringify({ project_id, node_id, text, user_id: auth.user.id })
  });

  const j = await r.json().catch(() => ({}));
  return NextResponse.json(j, { status: r.status });
}