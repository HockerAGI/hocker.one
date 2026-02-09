import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeProjectId, defaultProjectId } from "@/lib/project";

export const runtime = "nodejs";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function getUserAndProjectRole(sb: ReturnType<typeof createServerSupabase>, project_id: string) {
  const { data } = await sb.auth.getUser();
  const userId = data?.user?.id;

  if (!userId) {
    return { ok: false as const, status: 401, error: "No autorizado" };
  }

  const { data: pm, error: pmErr } = await sb
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (pmErr) {
    return { ok: false as const, status: 500, error: pmErr.message };
  }

  if (!pm?.role) {
    return { ok: false as const, status: 403, error: "No eres miembro de este proyecto." };
  }

  return { ok: true as const, userId, role: String(pm.role) };
}

export async function POST(req: Request) {
  try {
    const sb = createServerSupabase();

    const body = await req.json().catch(() => ({}));

    const project_id = normalizeProjectId(body?.project_id ?? defaultProjectId());
    let thread_id = String(body?.thread_id ?? "").trim();
    if (!thread_id || !isUuid(thread_id)) thread_id = crypto.randomUUID();

    const message = String(body?.message ?? "").trim();
    const text = String(body?.text ?? "").trim();
    const content = (message || text).trim();

    if (!content) {
      return NextResponse.json({ error: "Falta message/text." }, { status: 400 });
    }

    // Requiere sesión + membership por proyecto
    const auth = await getUserAndProjectRole(sb, project_id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const NOVA_AGI_URL = (process.env.NOVA_AGI_URL || process.env.NEXT_PUBLIC_NOVA_AGI_URL || "").trim();
    const NOVA_ORCHESTRATOR_KEY = (process.env.NOVA_ORCHESTRATOR_KEY || "").trim();

    if (!NOVA_AGI_URL) {
      return NextResponse.json({ error: "NOVA_AGI_URL no está configurado." }, { status: 500 });
    }
    if (!NOVA_ORCHESTRATOR_KEY) {
      return NextResponse.json({ error: "NOVA_ORCHESTRATOR_KEY no está configurado." }, { status: 500 });
    }

    // Acciones: solo si el usuario es admin/owner y explícitamente las pide (header)
    const allowActionsReq = String(req.headers.get("x-allow-actions") ?? "0");
    const canActions = (auth.role === "owner" || auth.role === "admin") && allowActionsReq === "1";

    const prefer = (body?.prefer ?? "auto") as any;
    const mode = (body?.mode ?? "auto") as any;

    const r = await fetch(`${NOVA_AGI_URL.replace(/\/$/, "")}/v1/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${NOVA_ORCHESTRATOR_KEY}`,
        ...(canActions ? { "x-allow-actions": "1" } : {}),
      },
      body: JSON.stringify({
        project_id,
        thread_id,
        message: content,
        text: content, // compat
        prefer,
        mode,
        user_id: auth.userId, // útil para auditoría/meta (no es auth)
      }),
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: j?.error || `Orchestrator error (${r.status})`, details: j },
        { status: 502 }
      );
    }

    // IMPORTANTÍSIMO:
    // No insertamos en nova_threads/nova_messages aquí.
    // nova.agi es quien persiste la memoria (evitamos duplicados).
    return NextResponse.json({
      ok: true,
      project_id: String(j?.project_id ?? project_id),
      thread_id: String(j?.thread_id ?? thread_id),
      reply: String(j?.reply ?? ""),
      meta: j?.meta ?? null,
      provider: j?.provider ?? null,
      model: j?.model ?? null,
      intent: j?.intent ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}