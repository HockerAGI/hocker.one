import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { executeCommand } from "@/server/executor/hocker-core-executor";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const cronSecret = String(process.env.CRON_SECRET ?? "").trim();
  const authHeader = req.headers.get("authorization") ?? "";

  // 1. Blindaje de seguridad del orquestador
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "Acceso denegado al núcleo del orquestador." },
      { status: 401 }
    );
  }

  const sb = createAdminSupabase();

  try {
    // 2. Procesamiento por Lotes (Batching): Previene el desbordamiento de memoria
    // Solo tomamos un máximo de 10 comandos encolados por ciclo
    const { data: commands, error: fetchError } = await sb
      .from("commands")
      .select("id, project_id")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      throw new Error(`Anomalía de lectura en la matriz de comandos: ${fetchError.message}`);
    }

    if (!commands || commands.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, note: "Matriz limpia." }, { status: 200 });
    }

    // 3. Tolerancia a fallos paralela: Si un nodo falla, el resto sobrevive y se ejecuta
    const executionPromises = commands.map((cmd) => executeCommand(cmd.id, cmd.project_id));
    const results = await Promise.allSettled(executionPromises);

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - successful;

    return NextResponse.json({
      ok: true,
      processed: successful,
      failed: failed,
      total_in_batch: commands.length
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Colapso interno del orquestador." },
      { status: 500 }
    );
  }
}