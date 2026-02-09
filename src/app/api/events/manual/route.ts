import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

async function requireProjectAdmin(project_id: string) {
  const sb = createServerSupabase();
  const { data } = await sb.auth.getUser();
  const userId = data?.user?.id;
  if (!userId) return { ok: false as const, status: 401, error: "No autorizado" };

  const { data: pm, error: pmErr } = await sb
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (pmErr) return { ok: false as const, status: 500, error: pmErr.message };
  const role = String(pm?.role ?? "");
  if (!role) return { ok: false as const, status: 403, error: "No eres miembro del proyecto." };
  if (!["owner", "admin"].includes(role)) {
    return { ok: false as const, status: 403, error: "Permisos insuficientes (admin/owner)." };
  }

  return { ok: true as const, sb, userId, role };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const project_id = normalizeProjectId(body?.project_id ?? defaultProjectId());

    const auth = await requireProjectAdmin(project_id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const sb = auth.sb;

    const node_id = (body?.node_id ?? null) as string | null;
    const level = String(body?.level ?? "info");
    const type = String(body?.type ?? "manual");
    const message = String(body?.message ?? "").trim();
    const data = body?.data ?? null;

    if (!message) return NextResponse.json({ error: "Falta message." }, { status: 400 });

    const { error } = await sb.from("events").insert({
      project_id,
      node_id,
      level,
      type,
      message,
      data,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await sb.from("audit_logs").insert({
      project_id,
      actor_type: "user",
      actor_id: auth.userId,
      action: "emit_event_manual",
      target: `events:${type}`,
      meta: { node_id, level },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}