import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase-admin";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const project_id = (body?.project_id ?? "global").toString().trim() || "global";
    let thread_id = (body?.thread_id ?? "").toString().trim();
    if (!thread_id || !isUuid(thread_id)) thread_id = crypto.randomUUID();

    const text = (body?.message ?? body?.text ?? "").toString().trim();
    if (!text) {
      return NextResponse.json({ error: "Falta message/text." }, { status: 400 });
    }

    const node_id = (body?.node_id ?? "nova").toString().trim() || "nova";
    const user_id = (body?.user_id ?? null) as string | null;

    const sb = createAdminSupabase();

    // Ensure thread exists
    await sb.from("nova_threads").upsert(
      {
        id: thread_id,
        project_id,
        title: body?.title ?? null,
      },
      { onConflict: "id" }
    );

    // Save user message
    await sb.from("nova_messages").insert({
      project_id,
      thread_id,
      role: "user",
      content: text,
    });

    // Route to orchestrator (nova.agi)
    // For now, we call a local endpoint configured in env:
    const base = process.env.NOVA_AGI_URL || process.env.NEXT_PUBLIC_NOVA_AGI_URL;
    if (!base) {
      await sb.from("nova_messages").insert({
        project_id,
        thread_id,
        role: "nova",
        content: "NOVA_AGI_URL no está configurado.",
      });
      return NextResponse.json({
        ok: true,
        project_id,
        thread_id,
        reply: "NOVA_AGI_URL no está configurado.",
      });
    }

    const r = await fetch(`${base.replace(/\/$/, "")}/v1/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text,
        node_id,
        project_id,
        user_id,
        thread_id,
      }),
    });

    const j = await r.json().catch(() => ({}));
    const reply = (j?.reply ?? j?.text ?? "").toString().trim() || "OK";

    await sb.from("nova_messages").insert({
      project_id,
      thread_id,
      role: "nova",
      content: reply,
    });

    return NextResponse.json({ ok: true, project_id, thread_id, reply });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 500 });
  }
}