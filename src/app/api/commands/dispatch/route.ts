// Archivo a crear en el repo hocker.one: src/app/api/commands/dispatch/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { tasks } from "@trigger.dev/sdk/v3";
import { ApiError, toApiError } from "../../_lib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const project_id = String(body.project_id || "global").trim();
    
    // VERTX SECURITY: Validar que quien llama es NOVA AGI (Posee la llave HMAC)
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedKey = String(process.env.COMMAND_HMAC_SECRET || "").trim();
    
    if (!expectedKey || authHeader !== expectedKey) {
      return NextResponse.json({ error: "Firma de delegación (Dispatch) inválida." }, { status: 401 });
    }

    const sb = createServerSupabase();

    // Buscar comandos de failover (o nativos de nube) que estén esperando ejecución
    const { data: commands, error } = await sb
      .from("commands")
      .select("*")
      .eq("project_id", project_id)
      .eq("status", "queued")
      .eq("needs_approval", false)
      .in("node_id", ["hocker-fabric", "cloud-node"]) // Buscar solo los designados a la nube
      .limit(10); // Lote de ejecución

    if (error) throw new ApiError(500, { error: error.message });

    if (!commands || commands.length === 0) {
      return NextResponse.json({ ok: true, dispatched: 0, message: "No hay tareas de nube en cola." });
    }

    let count = 0;
    for (const cmd of commands) {
      try {
        // Empujamos a la Automation Fabric (Trigger.dev)
        await tasks.trigger("hocker-core-executor", {
          commandId: cmd.id,
          nodeId: cmd.node_id,
          command: cmd.command,
          payload: cmd.payload,
          projectId: cmd.project_id
        });
        count++;
      } catch (triggerError) {
        console.error(`[TRIGGER.DEV ERROR] Fallo al despachar comando ${cmd.id}:`, triggerError);
      }
    }

    return NextResponse.json({ ok: true, dispatched: count });
  } catch (e: any) {
    const ex = toApiError(e);
    return NextResponse.json(ex.payload, { status: ex.status });
  }
}