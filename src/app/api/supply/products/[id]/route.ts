import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

function asInt(value: unknown, fallback = 0): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return true;
    if (["0", "false", "no", "off"].includes(s)) return false;
  }
  return fallback;
}

function asJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("supply_products")
      .select("*")
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new ApiError(500, { error: `Error al leer el producto: ${getErrorMessage(error)}` });
    if (!data) throw new ApiError(404, { error: "Producto no encontrado" });

    return json({ ok: true, item: data });
  } catch (err: unknown) {
    const ex = toApiError(err);
    return json(ex.body, ex.status);
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const trace = langfuse.trace({ name: "Supply_Product_Update", metadata: { productId: id } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "inventory"] });

    const updates: Record<string, unknown> = { ...body };
    delete updates.id;
    delete updates.project_id;

    if (Object.prototype.hasOwnProperty.call(updates, "price_cents")) {
      updates.price_cents = Math.max(0, asInt(updates.price_cents, 0));
    }
    if (Object.prototype.hasOwnProperty.call(updates, "cost_cents")) {
      updates.cost_cents = Math.max(0, asInt(updates.cost_cents, 0));
    }
    if (Object.prototype.hasOwnProperty.call(updates, "stock")) {
      updates.stock = Math.max(0, asInt(updates.stock, 0));
    }
    if (Object.prototype.hasOwnProperty.call(updates, "active")) {
      updates.active = toBool(updates.active, true);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "currency")) {
      updates.currency = String(updates.currency ?? "MXN").trim().toUpperCase() || "MXN";
    }

    updates.description = Object.prototype.hasOwnProperty.call(updates, "description")
      ? (updates.description ? String(updates.description).trim() : null)
      : undefined;
    updates.sku = Object.prototype.hasOwnProperty.call(updates, "sku")
      ? (updates.sku ? String(updates.sku).trim() : null)
      : undefined;
    updates.meta = asJsonObject(updates.meta);
    updates.updated_at = new Date().toISOString();

    const { data, error } = await ctx.sb
      .from("supply_products")
      .update(updates)
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: `Error al actualizar el producto: ${getErrorMessage(error)}` });

    trace.event({ name: "Product_Updated", input: updates });
    await langfuse.flushAsync();

    return json({ ok: true, item: data });
  } catch (err: unknown) {
    trace.event({ name: "ERROR", input: { error: getErrorMessage(err) } });
    await langfuse.flushAsync();
    const ex = toApiError(err);
    return json(ex.body, ex.status);
  }
}