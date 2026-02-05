import { NextResponse } from "next/server";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";
import { requireRole } from "@/lib/authz";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());
  const node_id = String(body.node_id ?? process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ?? "node-hocker-01");
  const action = String(body.action ?? "");
  const params = (body.params ?? {}) as Record<string, unknown>;

  if (!action) return NextResponse.json({ ok: false, error: "Falta action" }, { status: 400 });

  const auth = await requireRole(["owner", "admin"], project_id);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = process.env.NOVA_ORCHESTRATOR_URL ?? "";
  const key = process.env.NOVA_ORCHESTRATOR_KEY ?? "";
  if (!url || !key) return NextResponse.json({ ok: false, error: "Falta NOVA_ORCHESTRATOR_URL o KEY" }, { status: 500 });

  const r = await fetch(`${url}/v1/execute`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hocker-key": key },
    body: JSON.stringify({ project_id: auth.project_id, node_id, action, params, user_id: auth.user.id })
  });

  const j = await r.json().catch(() => ({}));
  if (!r.ok) return NextResponse.json({ ok: false, error: j?.error ?? "Error NOVA" }, { status: r.status });

  return NextResponse.json({ ok: true, ...j });
}