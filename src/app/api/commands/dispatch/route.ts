import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { tasks } from "@trigger.dev/sdk/v3";
import { ApiError, toApiError, json } from "../../_lib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const project_id = String(body.project_id || "global").trim();

    // 1. Protocolo de Seguridad Estricto (Zero-Trust)
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "")?.trim() || "";
    const expectedKey = String(process.env.COMMAND_HMAC_SECRET || "").trim();

    if (!expectedKey || authHeader !== expectedKey) {
      console.warn("[NOVA Dispatch] Intercepción de seguridad: Intento de despacho sin credenciales válidas.");
      throw new ApiError(401, { error: "Acceso Denegado: Firma de delegación (Dispatch) inválida o ausente." });
    }

    const sb = createAdminSupabase();

    // 2. Verificación de Gobernanza (Kill Switch)
    const { data: controls, error: ctrlErr } = await sb
      .from("system_controls")
      .select("kill_switch, allow_write")
      .eq("project_id", project_id)
      .eq("id", "global")
      .maybeSingle();

    if (ctrlErr) throw new ApiError(500, { error: "Falla al leer los protocolos de gobernanza en la matriz." });

    if (controls?.kill_switch) {
      console.info("[NOVA Dispatch] Despacho detenido: Kill Switch activo.");
      return json({ ok: true, dispatched: 0, message: "BLOQUEO: Kill-switch activo. Despacho detenido." }, 200);
    }

    // 3. Lectura de la Memoria Operativa (Comandos en Cola)
    const { data: commands, error } = await sb
      .from("commands")
      .select("*")
      .eq("project_id", project_id)
      .eq("status", "queued")
      .eq("needs_approval", false)
      .order("created_at", { ascending: true }) // Respetar el orden cronológico exacto
      .limit(20);

    if (error) throw new ApiError(500, { error: "Falla al escanear la cola de comandos: " + error.message });

    // Filtrar exclusivamente comandos destinados a la nube (Trigger.dev / Hocker Fabric)
    const cloudCommands = (commands ?? []).filter((cmd: any) =>
      String(cmd.node_id || "").startsWith("cloud-") ||
      cmd.node_id === "hocker-fabric" ||
      String(cmd.node_id || "").startsWith("trigger-")
    );

    if (cloudCommands.length === 0) {
      return json({ ok: true, dispatched: 0, message: "Malla despejada. No hay tareas de nube en cola." });
    }

    // 4. Inyección a la Nube (Orquestación Trigger.dev)
    let count = 0;
    for (const cmd of cloudCommands) {
      try {
        await tasks.trigger("hocker-core-executor", {
          commandId: cmd.id,
          nodeId: cmd.node_id,
          command: cmd.command,
          payload: cmd.payload,
          projectId: cmd.project_id,
        });
        count++;
        console.info(`[NOVA Dispatch] Orden ${cmd.id} inyectada con éxito en la nube.`);
      } catch (triggerError: any) {
        // Aislamiento de fallos: Si un comando falla al enviarse, el bucle continúa con los demás.
        console.error(`[NOVA Dispatch] Anomalía al despachar orden ${cmd.id}:`, triggerError.message);
      }
    }

    return json({ ok: true, dispatched: count, message: `Despacho completado: ${count} órdenes inyectadas.` });

  } catch (e: any) {
    const apiErr = toApiError(e);
    console.error("[NOVA Dispatch] Falla de sistema:", apiErr.payload);
    // Usamos nuestra función unificada de _lib para garantizar respuestas consistentes
    return json(apiErr.payload, apiErr.status);
  }
}
