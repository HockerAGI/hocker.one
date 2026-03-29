import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

// Inicialización de la Caja Negra (Telemetría de IA)
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request) {
  // Telemetría con nomenclatura táctica
  const trace = langfuse.trace({ name: "Rechazo_Tactico", metadata: { endpoint: "/api/commands/reject" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();
    const id = String(body.id ?? "").trim();

    if (!id) throw new ApiError(400, { error: "Falta el ID del comando a rechazar." });

    // Validación de autoridad (Solo el Director o Administradores pueden denegar)
    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "rejection"] });

    // Escudo de Gobernanza
    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "BLOQUEO: Kill Switch Activo. El sistema está congelado." });
    }

    // Ejecución del rechazo en la base de datos
    const { data, error } = await ctx.sb
      .from("commands")
      .update({
        status: "canceled",
        needs_approval: false,
        error: "Orden denegada manualmente por el Director.", // Mensaje profesional para el registro
        finished_at: new Date().toISOString(),
      })
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: "Falla al registrar el rechazo en la matriz de datos." });

    // Cierre de auditoría exitosa
    trace.event({ name: "Orden_Anulada", input: { commandId: id } });
    trace.event({ name: "OPERACION_EXITOSA" });

    return json({ ok: true, item: data });

  } catch (e: any) {
    // Intercepción de errores unificada
    const apiErr = toApiError(e);
    trace.event({ name: "ERROR_OPERATIVO", level: "ERROR", output: { error: apiErr.payload } });
    return json(apiErr.payload, apiErr.status);
  } finally {
    // Forzamos el guardado de la telemetría antes de cerrar el proceso
    await langfuse.flushAsync();
  }
}
