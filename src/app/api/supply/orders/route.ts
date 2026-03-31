import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { normalizeSupplyOrderStatus } from "@/lib/types";
import { ApiError, getControls, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

function asInt(value: unknown, fallback = 0): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

function asJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

type OrderItemInput = {
  product_id?: unknown;
  qty?: unknown;
  unit_price_cents?: unknown;
};

export async function GET(req: Request) {
  const trace = langfuse.trace({ name: "Logistica_Listado_Ordenes", metadata: { endpoint: "/api/supply/orders" } });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();
    const include_items = q.get("include_items") === "1";

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "logistica", "lectura"] });

    const select = include_items ? "*, items:supply_order_items(*)" : "*";

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .select(select)
      .eq("project_id", ctx.project_id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new ApiError(500, { error: `Falla al consultar el registro logístico: ${getErrorMessage(error)}` });

    trace.event({ name: "LECTURA_EXITOSA" });
    return json({ ok: true, items: data ?? [] });
  } catch (err: unknown) {
    const ex = toApiError(err);
    trace.event({ name: "ERROR_LECTURA_LOGISTICA", level: "ERROR", output: { error: ex.message } });
    return json(ex.body, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Logistica_Creacion_Orden", metadata: { endpoint: "/api/supply/orders" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "finance", "logistica"] });

    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "BLOQUEO GENERAL: Kill Switch Activo. Creación de órdenes suspendida." });
    }
    if (!controls.allow_write) {
      throw new ApiError(403, { error: "MODO SEGURO: El sistema está en solo lectura." });
    }

    const customer_name = body.customer_name ? String(body.customer_name).trim() : null;
    const customer_phone = body.customer_phone ? String(body.customer_phone).trim() : null;
    const status = normalizeSupplyOrderStatus(body.status ? String(body.status) : "pending");
    const currency = String(body.currency || "MXN").trim().toUpperCase() || "MXN";
    const meta = asJsonObject(body.meta);

    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    if (!itemsRaw.length) {
      throw new ApiError(400, { error: "Se requiere al menos un artículo para procesar el suministro." });
    }

    const items = itemsRaw.map((raw) => {
      const it = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as OrderItemInput) : {};
      return {
        product_id: it.product_id ? String(it.product_id).trim() : null,
        qty: Math.max(1, asInt(it.qty, 1)),
        unit_price_cents: Math.max(0, asInt(it.unit_price_cents, 0)),
      };
    });

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
        error: "Falla crítica al registrar la transacción y los artículos.",
        details: getErrorMessage(error),
      });
    }

    trace.event({ name: "ORDEN_REGISTRADA_CON_EXITO", input: { order: data, status } });
    trace.event({ name: "OPERACION_EXITOSA" });

    return json({ ok: true, item: data }, 201);
  } catch (err: unknown) {
    const ex = toApiError(err);
    trace.event({ name: "ERROR_CREACION_LOGISTICA", level: "ERROR", output: { error: ex.message } });
    return json(ex.body, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}