import { getErrorMessage } from "@/lib/errors";
import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    const url = new URL(req.url);
    const project_id = String(url.searchParams.get("project_id") ?? "").trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("supply_products")
      .select("*")
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, { error: `Error al leer el producto: ${getErrorMessage(error)}` });
    }

    if (!data) {
      throw new ApiError(404, { error: "Producto no encontrado." });
    }

    return json({ ok: true, item: data });
  } catch (err: unknown) {
    const ex = toApiError(err);
    return json(ex.payload, ex.status);
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "").trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);

    const updates: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(body, "sku")) {
      updates.sku = typeof body.sku === "string" ? body.sku.trim() || null : null;
    }

    if (Object.prototype.hasOwnProperty.call(body, "name")) {
      updates.name = String(body.name ?? "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, "description")) {
      updates.description = typeof body.description === "string" ? body.description.trim() || null : null;
    }

    if (Object.prototype.hasOwnProperty.call(body, "price_cents")) {
      updates.price_cents = Math.max(0, asInt(body.price_cents, 0));
    }

    if (Object.prototype.hasOwnProperty.call(body, "cost_cents")) {
      updates.cost_cents = Math.max(0, asInt(body.cost_cents, 0));
    }

    if (Object.prototype.hasOwnProperty.call(body, "currency")) {
      updates.currency = String(body.currency ?? "MXN").trim().toUpperCase() || "MXN";
    }

    if (Object.prototype.hasOwnProperty.call(body, "stock")) {
      updates.stock = Math.max(0, asInt(body.stock, 0));
    }

    if (Object.prototype.hasOwnProperty.call(body, "active")) {
      updates.active = toBool(body.active, true);
    }

    if (Object.prototype.hasOwnProperty.call(body, "meta")) {
      updates.meta = asJsonObject(body.meta);
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await ctx.sb
      .from("supply_products")
      .update(updates)
      .eq("project_id", ctx.project_id)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, { error: `Error al actualizar el producto: ${getErrorMessage(error)}` });
    }

    return json({ ok: true, item: data });
  } catch (err: unknown) {
    const ex = toApiError(err);
    return json(ex.payload, ex.status);
  }
}