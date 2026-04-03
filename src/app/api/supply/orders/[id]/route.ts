import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { normalizeSupplyOrderStatus } from "@/lib/types";
import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function asInt(value: unknown, fallback = 0): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s || null;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const trace = langfuse.trace({
    name: "Logistica_Lectura_Orden",
    metadata: { endpoint: "/api/supply/orders/[id]" },
  });

  try {
    const { id } = await context.params;
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") ?? "").trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "logistica", "auditoria"] });

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .select("*, items:supply_order_items(*)")
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, {
        error: `Falla al consultar la matriz logística: ${getErrorMessage(error)}`,
      });
    }

    if (!data) {
      throw new ApiError(404, {
        error: "Orden logística no localizada en los registros.",
      });
    }

    trace.event({ name: "ORDEN_CARGADA", input: { id } });
    return json({ ok: true, item: data });
  } catch (err: unknown) {
    const ex = toApiError(err);
    trace.event({
      name: "ERROR_LECTURA_ORDEN",
      level: "ERROR",
      output: { error: ex.payload },
    });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const trace = langfuse.trace({
    name: "Logistica_Actualizacion_Orden",
    metadata: { orderId: id },
  });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "").trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "finance", "logistica"] });

    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, {
        error: "BLOQUEO GENERAL: Kill Switch activo. Operaciones congeladas.",
      });
    }

    if (!controls.allow_write) {
      throw new ApiError(403, {
        error: "MODO SEGURO: Modificación denegada.",
      });
    }

    const updates: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(body, "customer_name")) {
      updates.customer_name = asText(body.customer_name);
    }

    if (Object.prototype.hasOwnProperty.call(body, "customer_phone")) {
      updates.customer_phone = asText(body.customer_phone);
    }

    if (Object.prototype.hasOwnProperty.call(body, "status")) {
      updates.status = normalizeSupplyOrderStatus(
        typeof body.status === "string" ? body.status : "pending",
      );
    }

    if (Object.prototype.hasOwnProperty.call(body, "currency")) {
      updates.currency = String(body.currency ?? "MXN").trim().toUpperCase() || "MXN";
    }

    if (Object.prototype.hasOwnProperty.call(body, "total_cents")) {
      updates.total_cents = Math.max(0, asInt(body.total_cents, 0));
    }

    if (Object.prototype.hasOwnProperty.call(body, "meta")) {
      updates.meta = asJsonObject(body.meta);
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .update(updates)
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, {
        error: `Falla crítica al actualizar la orden: ${getErrorMessage(error)}`,
      });
    }

    trace.event({ name: "ESTADO_ORDEN_ACTUALIZADO", input: { id, update: updates } });
    trace.event({ name: "OPERACION_EXITOSA" });

    return json({ ok: true, item: data });
  } catch (err: unknown) {
    const ex = toApiError(err);
    trace.event({
      name: "ERROR_ACTUALIZACION_LOGISTICA",
      level: "ERROR",
      output: { error: ex.payload },
    });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}