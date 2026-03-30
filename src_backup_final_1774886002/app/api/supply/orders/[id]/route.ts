import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

// Inicialización de la Caja Negra (Telemetría de IA)
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

// PROTOCOLO DE LECTURA (Extracción de Orden Específica)
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const trace = langfuse.trace({ name: "Logistica_Lectura_Orden", metadata: { endpoint: "/api/supply_orders/[id]" } });

  try {
    const { id } = await context.params;
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") || "global").trim();

    // Permisos de auditoría operativa
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "logistica", "auditoria"] });

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .select(`*, items:supply_order_items(*)`)
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new ApiError(500, { error: "Falla de enlace al consultar la matriz logística." });
    if (!data) throw new ApiError(404, { error: "Orden logística no localizada en los registros." });

    trace.event({ name: "LECTURA_EXITOSA" });
    return json({ ok: true, item: data });

  } catch (e: unknown) {
    const ex = toApiError(e);
    trace.event({ name: "ERROR_LECTURA_LOGISTICA", level: "ERROR", output: { error: ex.payload } });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}

// PROTOCOLO DE ACTUALIZACIÓN (Modificación de Orden)
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const trace = langfuse.trace({ name: "Logistica_Actualizacion_Orden", metadata: { orderId: id } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();

    // Solo personal autorizado puede alterar la logística
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "finance", "logistica"] });

    // 1. Inyección del Escudo de Gobernanza (Evita alteraciones durante crisis)
    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "BLOQUEO GENERAL: Kill Switch Activo. Operaciones logísticas congeladas." });
    }
    if (!controls.allow_write) {
      throw new ApiError(403, { error: "MODO SEGURO: Modificación denegada. El sistema está en solo lectura." });
    }

    // Limpieza de campos inmutables antes de la actualización
    delete body.id;
    delete body.project_id;
    body.updated_at = new Date().toISOString();

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .update(body)
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: "Falla crítica al intentar sobreescribir la orden en la base de datos." });

    trace.event({ name: "ESTADO_ORDEN_ACTUALIZADO", input: { id, update: body } });
    trace.event({ name: "OPERACION_EXITOSA" });

    return json({ ok: true, item: data });

  } catch (e: unknown) {
    const ex = toApiError(e);
    trace.event({ name: "ERROR_ACTUALIZACION_LOGISTICA", level: "ERROR", output: { error: ex.payload } });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}
