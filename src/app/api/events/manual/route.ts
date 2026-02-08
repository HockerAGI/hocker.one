import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;

    if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

    const role = (prof?.role ?? "operator").toString();
    if (!["owner", "admin"].includes(role)) {
      return NextResponse.json({ error: "Permisos insuficientes." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const project_id = normalizeProjectId(body.project_id ?? defaultProjectId());

    const sb = createAdminSupabase();
    const { error } = await sb.from("events").insert({
      project_id,
      node_id: body.node_id ?? null,
      level: body.level ?? "info",
      type: body.type ?? "manual",
      message: body.message ?? "",
      data: body.data ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}