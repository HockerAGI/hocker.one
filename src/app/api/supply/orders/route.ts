import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { normalizeSupplyOrderStatus, type JsonObject } from "@/lib/types";
import { ApiError, getControls, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

function asInt(value: unknown, fallback = 0): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

function asJsonObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s || null;
}

type OrderItemInput = {
  product_id?: unknown;
  qty?: unknown;
  unit_price_cents?: unknown;
};

export async function GET(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "Logistica_Listado_Ordenes",
    metadata: { endpoint: "/api/supply/orders" },
  });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") ?? "").trim();
    const include_items = q.get("include_items") === "1";

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "logistica", "lectura"] });

    const select = include_items ? "*, items:supply_order_items(*)" : "*";

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .select(select)
      .eq("project_id", ctx.project_id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      throw new ApiError(500, {
        error: `Falla al consultar el registro logístico: ${getErrorMessage(error)}`,
      });
    }

    trace.event({ name: "LECTURA_EXITOSA" });
    return json({ ok: true, items: data ?? [] });
  } catch (err: unknown) {
    const ex = toApiError(err);
    trace.event({
      name: "ERROR_LECTURA_LOGISTICA",
      level: "ERROR",
      output: { error: ex.payload },
    });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}

export async function POST(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "Logistica_Creacion_Orden",
    metadata: { endpoint: "/api/supply/orders" },
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
        error: "BLOQUEO GENERAL: Kill Switch activo. Creación de órdenes suspendida.",
      });
    }

    if (!controls.allow_write) {
      throw new ApiError(403, {
        error: "MODO SEGURO: El sistema está en solo lectura.",
      });
    }

    const customer_name = asText(body.customer_name);
    const customer_phone = asText(body.customer_phone);
    const status = normalizeSupplyOrderStatus(
      typeof body.status === "string" ? body.status : "pending",
    );
    const currency = String(body.currency ?? "MXN").trim().toUpperCase() || "MXN";
    const meta = asJsonObject(body.meta);

    const itemsRaw = Array.isArray(body.items) ? (body.items as OrderItemInput[]) : [];
    if (itemsRaw.length === 0) {
      throw new ApiError(400, {
        error: "Se requiere al menos un artículo para procesar el suministro.",
      });
    }

    const items = itemsRaw.map((item) => ({
      product_id:
        typeof item.product_id === "string" && item.product_id.trim()
          ? item.product_id.trim()
          : null,
      qty: Math.max(1, asInt(item.qty, 1)),
      unit_price_cents:
        typeof item.unit_price_cents === "number" || typeof item.unit_price_cents === "string"
          ? Math.max(0, asInt(item.unit_price_cents, 0))
          : null,
    }));

    const { data, error } = await ctx.sb.rpc("supply_create_order", {
      p_project_id: ctx.project_id,
      p_status: status,
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
      p_currency: currency,
      p_items: items,
      p_meta: meta,
    });

    if (error) {
      throw new ApiError(500, {
        error: `No se pudo crear la orden logística: ${getErrorMessage(error)}`,
      });
    }

    trace.event({
      name: "ORDEN_CREADA",
      input: { project_id: ctx.project_id, items: items.length },
    });

    return json({ ok: true, result: data }, 201);
  } catch (err: unknown) {
    const ex = toApiError(err);
    trace.event({
      name: "ERROR_CREACION_LOGISTICA",
      level: "ERROR",
      output: { error: ex.payload },
    });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}