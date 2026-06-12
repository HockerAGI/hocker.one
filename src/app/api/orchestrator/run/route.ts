import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { executeCommand } from "@/server/executor/hocker-core-executor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getInternalSecret(): string {
  return String(
    process.env.HOCKER_ONE_INTERNAL_TOKEN ??
      process.env.CRON_SECRET ??
      "",
  ).trim();
}

export async function POST(req: Request) {
  const internalSecret = getInternalSecret();
  const authHeader = req.headers.get("authorization") ?? "";

  if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
    return NextResponse.json(
      { ok: false, error: "Acceso denegado al núcleo del orquestador." },
      { status: 401 },
    );
  }

  const sb = createAdminSupabase();

  try {
    const { data: commands, error: fetchError } = await sb
      .from("commands")
      .select("id, project_id, node_id")
      .eq("status", "queued")
      .eq("needs_approval", false)
      .like("node_id", "cloud-%")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      throw new Error(`Anomalía de lectura en la matriz de comandos: ${fetchError.message}`);
    }

    if (!commands || commands.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, note: "Sin comandos cloud pendientes." }, { status: 200 });
    }

    const executionPromises = commands.map((cmd) => executeCommand(cmd.id, cmd.project_id));
    const results = await Promise.allSettled(executionPromises);

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - successful;

    return NextResponse.json(
      {
        ok: true,
        processed: successful,
        failed,
        total_in_batch: commands.length,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Colapso interno del orquestador.",
      },
      { status: 500 },
    );
  }
}