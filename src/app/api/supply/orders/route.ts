import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { normalizeSupplyOrderStatus } from "@/lib/types";
import {
  ApiError,
  getControls,
  json,
  parseBody,
  parseQuery,
  requireProjectRole,
  toApiError,
} from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

type OrderItemInput = {
  product_id?: unknown;
  qty?: unknown;
  unit_price_cents?: unknown;
};

type SupplyOrderInsert = {
  project_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_cents: number;
  currency: string;
  status: ReturnType<typeof normalizeSupplyOrderStatus>;
  meta: Record<string, unknown>;
};

type SupplyOrderItemInsert = {
  order_id: string;
  project_id: string;
  product_id: string | null;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
  currency: string;
};

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

function asNullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

async function resolveProductPrices(
  sb: Awaited<ReturnType<typeof import("@/lib/supabase-server").createServerSupabase>>,
  projectId: string,
  itemsRaw: OrderItemInput[],
): Promise<Map<string, number>> {
  const ids = Array.from(
    new Set(
      itemsRaw
        .map((item) => (typeof item.product_id === "string" ? item.product_id.trim() : ""))
        .filter((value) => Boolean(value)),
    ),
  );

  const priceMap = new Map<string, number>();

  if (ids.length === 0) {
    return priceMap;
  }

  const { data, error } = await sb
    .from("supply_products")
    .select("id, price_cents")
    .eq("project_id", projectId)
    .in("id", ids);

  if (error) {
    throw new ApiError(500, {
      error: `Falla al resolver precios del catálogo: ${getErrorMessage(error)}`,
    });
  }

  for (const row of data ?? []) {
    const id = typeof row.id === "string" ? row.id : "";
    if (!id) continue;
    priceMap.set(id, asInt((row as { price_cents?: unknown }).price_cents, 0));
  }

  return priceMap;
}

export async function GET(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "Logistica_Listado_Ordenes",
    metadata: { endpoint: "/api/supply/orders" },
  });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();
    const include_items = q.get("include_items") === "1";

    const ctx = await requireProjectRole(project_id, [
      "owner",
      "admin",
      "operator",
      "viewer",
    ]);
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
    const project_id = String(body.project_id ?? "global").trim();

    const ctx = await requireProjectRole(project_id, [
      "owner",
      "admin",
      "operator",
    ]);
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

    const customer_name = asNullableText(body.customer_name);
    const customer_phone = asNullableText(body.customer_phone);
    const status = normalizeSupplyOrderStatus(
      typeof body.status === "string" ? body.status : "pending",
    );
    const currency =
      String(body.currency || "MXN").trim().toUpperCase() || "MXN";
    const meta = asJsonObject(body.meta);

    const itemsRaw = Array.isArray(body.items) ? (body.items as OrderItemInput[]) : [];
    if (itemsRaw.length === 0) {
      throw new ApiError(400, {
        error: "Se requiere al menos un artículo para procesar el suministro.",
      });
    }

    const priceMap = await resolveProductPrices(ctx.sb, ctx.project_id, itemsRaw);

    const items: SupplyOrderItemInsert[] = itemsRaw.map((raw) => {
      const productId =
        typeof raw.product_id === "string" && raw.product_id.trim()
          ? raw.product_id.trim()
          : null;

      const qty = Math.max(1, asInt(raw.qty, 1));
      const providedPrice = Math.max(0, asInt(raw.unit_price_cents, 0));
      const fallbackPrice = productId ? (priceMap.get(productId) ?? 0) : 0;
      const unit_price_cents = providedPrice > 0 ? providedPrice : fallbackPrice;
      const line_total_cents = qty * unit_price_cents;

      return {
        order_id: "",
        project_id: ctx.project_id,
        product_id: productId,
        qty,
        unit_price_cents,
        line_total_cents,
        currency,
      };
    });

    const total_cents = items.reduce((sum, item) => sum + item.line_total_cents, 0);
    const created_at = new Date().toISOString();

    const orderRow: SupplyOrderInsert = {
      project_id: ctx.project_id,
      customer_name,
      customer_phone,
      total_cents,
      currency,
      status,
      meta,
    };

    const { data: order, error: orderError } = await ctx.sb
      .from("supply_orders")
      .insert(orderRow)
      .select("id, project_id, customer_name, customer_phone, total_cents, currency, status, meta, created_at, updated_at")
      .single();

    if (orderError || !order) {
      throw new ApiError(500, {
        error: `No se pudo crear la orden logística: ${getErrorMessage(orderError)}`,
      });
    }

    const itemsWithOrderId: SupplyOrderItemInsert[] = items.map((item) => ({
      ...item,
      order_id: String(order.id),
    }));

    const { data: insertedItems, error: itemsError } = await ctx.sb
      .from("supply_order_items")
      .insert(itemsWithOrderId)
      .select("*");

    if (itemsError) {
      await ctx.sb
        .from("supply_orders")
        .delete()
        .eq("project_id", ctx.project_id)
        .eq("id", String(order.id));

      throw new ApiError(500, {
        error: `La orden se creó pero falló el detalle de artículos: ${getErrorMessage(itemsError)}`,
      });
    }

    trace.event({
      name: "ORDEN_CREADA",
      input: {
        orderId: order.id,
        items: itemsWithOrderId.length,
        total_cents,
      },
    });

    return json(
      {
        ok: true,
        item: order,
        items: insertedItems ?? [],
      },
      201,
    );
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