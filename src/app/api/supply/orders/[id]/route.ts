import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { normalizeSupplyOrderStatus } from "@/lib/types";
import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

function asJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const trace = langfuse.trace({ name: "Logistica_Lectura_Orden", metadata: { endpoint: "/api/supply/orders/[id]" } });

  try {
    const { id } = await context.params;
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "logistica", "auditoria"] });

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .select("*, items:supply_order_items(*)")
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new ApiError(500, { error: `Falla al consultar la matriz logística: ${getErrorMessage(error)}` });
    if (!data) throw new ApiError(404, { error: "Orden logística no localizada en los registros." });

    trace.event({ name: "LECTURA_EXITOSA" });
    return json({ ok: true, item: data });
  } catch (err: unknown) {
    const ex = toApiError(err);
    trace.event({ name: "ERROR_LECTURA_LOGISTICA", level: "ERROR", output: { error: ex.message } });
    return json(ex.body, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const trace = langfuse.trace({ name: "Logistica_Actualizacion_Orden", metadata: { orderId: id } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "finance", "logistica"] });

    const controls: { kill_switch?: boolean; allow_write?: boolean; [key: string]: unknown } = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "BLOQUEO GENERAL: Kill Switch Activo. Operaciones congeladas." });
    }
    if (!controls.allow_write) {
      throw new ApiError(403, { error: "MODO SEGURO: Modificación denegada." });
    }

    const updates: Record<string, unknown> = { ...body };
    delete updates.id;
    delete updates.project_id;

    if (Object.prototype.hasOwnProperty.call(updates, "status")) {
      updates.status = normalizeSupplyOrderStatus(String(updates.status ?? "pending"));
    }

    updates.updated_at = new Date().toISOString();
    updates.meta = asJsonObject(updates.meta);

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .update(updates)
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: `Falla crítica al actualizar la orden: ${getErrorMessage(error)}` });

    trace.event({ name: "ESTADO_ORDEN_ACTUALIZADO", input: { id, update: updates } });
    trace.event({ name: "OPERACION_EXITOSA" });

    return json({ ok: true, item: data });
  } catch (err: unknown) {
    const ex = toApiError(err);
    trace.event({ name: "ERROR_ACTUALIZACION_LOGISTICA", level: "ERROR", output: { error: ex.message } });
    return json(ex.body, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}