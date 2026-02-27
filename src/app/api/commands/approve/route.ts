import { ApiError, ensureNode, getControls, json, parseBody, requireProjectRole, toApiError } from "../../_lib";
import { tasks } from "@trigger.dev/sdk";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Commands_Approve", metadata: { endpoint: "/api/commands/approve" } });
  
  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const id = String(body.id ?? "").trim();

    if (!id) throw new ApiError(400, { error: "Falta id." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "approval"] });

    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "VERTX SECURITY: Kill Switch ON. No se pueden aprobar acciones." });
    }
    if (!controls.allow_write) {
      throw new ApiError(423, { error: "Modo lectura activo. Activa 'Modo de Escritura' en Seguridad para aprobar acciones." });
    }

    const { data: cmd, error: cmdErr } = await ctx.sb
      .from("commands")
      .select("*")
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (cmdErr) throw new ApiError(400, { error: cmdErr.message });
    if (!cmd?.id) throw new ApiError(404, { error: "Comando no encontrado." });
    if (!cmd.node_id) throw new ApiError(400, { error: "El comando no tiene node_id (destino)." });

    await ensureNode(ctx.sb, ctx.project_id, cmd.node_id);

    const { data, error } = await ctx.sb
      .from("commands")
      .update({ 
        status: "queued", 
        needs_approval: false, 
        approved_at: new Date().toISOString(),
        approved_by: ctx.user?.id || null
      })
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(400, { error: error.message });

    // ==========================================
    // ENRUTADOR HÍBRIDO TRAS APROBACIÓN
    // ==========================================
    const nodeId = String(data.node_id || "");
    const isCloudNode = nodeId.startsWith("cloud-") || nodeId === "hocker-fabric" || nodeId.startsWith("trigger-");

    if (isCloudNode) {
      try {
        await tasks.trigger("hocker-core-executor", {
          commandId: data.id, nodeId: nodeId, command: data.command, payload: data.payload, projectId: ctx.project_id
        });
        trace.event({ name: "TriggerDev_Dispatched_After_Approval", input: { id: data.id } });
      } catch (triggerError: any) {
        trace.event({ name: "TriggerDev_Fallback", level: "WARNING", statusMessage: triggerError.message });
      }
    } else {
      // Si es un nodo físico, al cambiar el estado a "queued", el nodo lo procesará en su próximo ciclo de Polling.
      trace.event({ name: "PhysicalNode_Approved_And_Queued", input: { id: data.id, node_id: data.node_id } });
    }

    trace.update({ statusMessage: "SUCCESS" });
    await langfuse.flushAsync();

    return json({ ok: true, item: data }, 200);
  } catch (e: any) {
    trace.update({ level: "ERROR", statusMessage: e.message });
    await langfuse.flushAsync();
    const ex = toApiError(e);
    return json(ex.payload, ex.status);
  }
}
