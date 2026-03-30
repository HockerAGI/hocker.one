import { tasks } from "@trigger.dev/sdk/v3";
import { Langfuse } from "langfuse-node";
import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../_lib";
import { verifyCommandSignature } from "@/lib/security";

export const runtime = "nodejs";

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

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "approval"] });

    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "BLOQUEO: Kill Switch Activo. Imposible aprobar la orden." });
    }

    const { data: cmdData, error: fetchErr } = await ctx.sb
      .from("commands")
      .select("*")
      .eq("id", id)
      .eq("project_id", ctx.project_id)
      .maybeSingle();

    if (fetchErr || !cmdData) {
      throw new ApiError(404, { error: "Orden no localizada en la memoria." });
    }

    if (cmdData.status !== "needs_approval") {
      throw new ApiError(409, { error: "La orden ya no está pendiente de aprobación." });
    }

    const secret = String(process.env.COMMAND_HMAC_SECRET || "").trim();
    if (!secret) {
      throw new ApiError(500, { error: "Llave HMAC ausente. No se puede validar la orden." });
    }

    const signatureOk = verifyCommandSignature(
      secret,
      cmdData.signature,
      cmdData.id,
      cmdData.project_id,
      cmdData.node_id,
      cmdData.command,
      cmdData.payload,
      cmdData.created_at
    );

    if (!signatureOk) {
      throw new ApiError(403, { error: "La firma del comando es inválida. Operación abortada." });
    }

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

    const isCloudNode =
      String(cmdData.node_id || "").startsWith("cloud-") ||
      cmdData.node_id === "hocker-fabric" ||
      String(cmdData.node_id || "").startsWith("trigger-");

    if (isCloudNode) {
      try {
        await tasks.trigger("hocker-core-executor", {
          commandId: data.id,
          nodeId: data.node_id,
          command: data.command,
          payload: data.payload,
          projectId: data.project_id,
        });
      } catch (triggerError: unknown) {
        await ctx.sb
          .from("commands")
          .update({
            status: "error",
            error: `Fallo al despachar después de aprobar: ${triggerError.message}`,
            finished_at: new Date().toISOString(),
          })
          .eq("project_id", ctx.project_id)
          .eq("id", id);

        throw new ApiError(500, {
          error: `La orden fue aprobada, pero el motor remoto falló: ${triggerError.message}`,
        });
      }
    }

    trace.event({ name: "Orden_Aprobada", input: { commandId: id } });
    trace.event({ name: "OPERACION_EXITOSA" });

    return json({ ok: true, item: data });
  } catch (e: unknown) {
    const apiErr = toApiError(e);
    trace.event({ name: "ERROR_OPERATIVO", level: "ERROR", output: { error: apiErr.payload } });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}