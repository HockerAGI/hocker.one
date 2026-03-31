import { getErrorMessage } from "@/lib/errors";
import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

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

export async function GET(req: Request) {
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("supply_products")
      .select("*")
      .eq("project_id", ctx.project_id)
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, { error: `Error al cargar el catálogo: ${getErrorMessage(error)}` });

    return json({ ok: true, items: data ?? [] });
  } catch (err: unknown) {
    const ex = toApiError(err);
    return json(ex.body, ex.status);
  }
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "").trim();

    if (!project_id) throw new ApiError(400, { error: "project_id es requerido." });

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);

    const name = String(body.name || "").trim();
    const price_cents = Math.max(0, asInt(body.price_cents, 0));
    const cost_cents = Math.max(0, asInt(body.cost_cents, 0));
    const stock = Math.max(0, asInt(body.stock, 0));
    const currency = String(body.currency || "MXN").trim().toUpperCase() || "MXN";
    const active = toBool(body.active, true);

    if (!name) throw new ApiError(400, { error: "El nombre del producto es obligatorio." });

    const { data, error } = await ctx.sb
      .from("supply_products")
      .insert({
        project_id,
        name,
        description: body.description ? String(body.description).trim() : null,
        price_cents,
        cost_cents,
        currency,
        sku: body.sku ? String(body.sku).trim() : null,
        stock,
        active,
        meta: asJsonObject(body.meta),
      })
      .select("*")
      .single();

    if (error) throw new ApiError(500, { error: `Fallo al registrar el producto: ${getErrorMessage(error)}` });

    return json({ ok: true, item: data }, 201);
  } catch (err: unknown) {
    const ex = toApiError(err);
    return json(ex.body, ex.status);
  }
}