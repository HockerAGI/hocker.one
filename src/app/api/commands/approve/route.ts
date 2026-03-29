import { ApiError, ensureNode, getControls, json, parseBody, requireProjectRole, toApiError } from "../../_lib";
import { tasks } from "@trigger.dev/sdk/v3";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

// Inicialización de la Caja Negra (Telemetría de IA)
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Aprobacion_Tactica", metadata: { endpoint: "/api/commands/approve" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const id = String(body.id ?? "").trim();

    if (!id) throw new ApiError(400, { error: "Falta el ID del comando a aprobar." });

    // Validación de autoridad
    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "approval"] });

    // Escudo de Gobernanza
    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "BLOQUEO: Kill Switch Activo. Imposible aprobar la orden." });
    }

    if (!controls.allow_write) {
      throw new ApiError(403, { error: "MODO SEGURO: El panel está en modo de solo lectura." });
    }

    // Recuperamos el comando intacto de la base de datos
    const { data: cmdData, error: fetchErr } = await ctx.sb
      .from("commands")
      .select("*")
      .eq("id", id)
      .eq("project_id", ctx.project_id)
      .single();

    if (fetchErr || !cmdData) throw new ApiError(404, { error: "Orden no localizada en la memoria." });

    // Confirmamos que el nodo objetivo exista
    await ensureNode(ctx.sb, ctx.project_id, cmdData.node_id);

    // Cambiamos el estado de "Requiere Aprobación" a "En Cola"
    const { data, error } = await ctx.sb
      .from("commands")
      .update({
        status: "queued",
        needs_approval: false,
        approved_at: new Date().toISOString(),
      })
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: "Falla al registrar la aprobación en la base de datos." });

    // Enrutamiento Inteligente: Nube vs Físico
    const isCloudNode = data.node_id.startsWith("cloud-") || data.node_id === "hocker-fabric" || data.node_id.startsWith("trigger-");

    if (isCloudNode) {
      try {
        await tasks.trigger("hocker-core-executor", {
          commandId: data.id,
          nodeId: data.node_id,
          command: data.command,
          payload: data.payload,
          projectId: ctx.project_id,
        });
        trace.event({ name: "Disparo_A_Nube_Exitoso", input: { id: data.id } });
      } catch (triggerError: any) {
        trace.event({ name: "Falla_TriggerDev", input: { error: triggerError.message } });
        throw new ApiError(500, { error: `El motor de ejecución remoto falló: ${triggerError.message}` });
      }
    } else {
      // El nodo físico (ej. tu celular) leerá esta cola por su cuenta
      trace.event({ name: "En_Espera_Nodo_Fisico", input: { id: data.id, node_id: data.node_id } });
    }

    trace.event({ name: "OPERACION_EXITOSA" });
    return json({ ok: true, item: data });

  } catch (e: any) {
    const apiErr = toApiError(e);
    trace.event({ name: "ERROR_OPERATIVO", level: "ERROR", output: { error: apiErr.payload } });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}
