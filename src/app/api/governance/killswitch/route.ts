import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

async function requireProjectOwner(project_id: string) {
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
  if (role !== "owner") {
    return { ok: false as const, status: 403, error: "Solo owner puede modificar governance." };
  }

  return { ok: true as const, sb, userId, role };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const project_id = normalizeProjectId(url.searchParams.get("project_id") ?? defaultProjectId());

    const sb = createServerSupabase();
    const { data } = await sb.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Verifica que sea miembro (solo lectura)
    const { data: pm } = await sb
      .from("project_members")
      .select("role")
      .eq("project_id", project_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!pm?.role) return NextResponse.json({ error: "No eres miembro del proyecto." }, { status: 403 });

    const { data: ctrl, error } = await sb
      .from("system_controls")
      .select("id, project_id, kill_switch, allow_write, updated_at")
      .eq("project_id", project_id)
      .eq("id", "global")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      project_id,
      controls: ctrl ?? { id: "global", project_id, kill_switch: false, allow_write: false, updated_at: null },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const project_id = normalizeProjectId(body?.project_id ?? defaultProjectId());

    const auth = await requireProjectOwner(project_id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const sb = auth.sb;

    const kill_switch = !!body?.kill_switch;
    const allow_write = !!body?.allow_write;

    const now = new Date().toISOString();

    const { error: upErr } = await sb.from("system_controls").upsert(
      {
        id: "global",
        project_id,
        kill_switch,
        allow_write,
        updated_at: now,
      },
      { onConflict: "id,project_id" }
    );

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    await sb.from("events").insert({
      project_id,
      node_id: "governance",
      level: "info",
      type: "governance_update",
      message: `Governance actualizado: kill_switch=${kill_switch} allow_write=${allow_write}`,
      data: { kill_switch, allow_write },
    });

    await sb.from("audit_logs").insert({
      project_id,
      actor_type: "user",
      actor_id: auth.userId,
      action: "update_system_controls",
      target: "system_controls:global",
      meta: { kill_switch, allow_write },
    });

    return NextResponse.json({ ok: true, project_id, kill_switch, allow_write });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}