import { getErrorMessage } from "@/lib/errors";
import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError, getControls } from "../../_lib";

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

export async function GET(req: Request): Promise<Response> {
  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") ?? "").trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    const { data, error } = await ctx.sb
      .from("supply_products")
      .select("id, project_id, sku, name, description, price_cents, cost_cents, currency, stock, active, meta, created_at, updated_at")
      .eq("project_id", ctx.project_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new ApiError(500, { error: `Error al cargar el catálogo: ${getErrorMessage(error)}` });
    }

    return json({ ok: true, items: data ?? [] });
  } catch (err: unknown) {
    const ex = toApiError(err);
    return json(ex.payload, ex.status);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "").trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      throw new ApiError(423, { error: "Kill Switch activo. No se puede modificar supply." });
    }

    if (!controls.allow_write) {
      throw new ApiError(403, { error: "Modo solo lectura activo." });
    }

    const name = String(body.name ?? "").trim();
    if (!name) {
      throw new ApiError(400, { error: "El nombre del producto es obligatorio." });
    }

    const sku = typeof body.sku === "string" ? body.sku.trim() || null : null;
    const description = typeof body.description === "string" ? body.description.trim() || null : null;
    const price_cents = Math.max(0, asInt(body.price_cents, 0));
    const cost_cents = Math.max(0, asInt(body.cost_cents, 0));
    const currency = String(body.currency ?? "MXN").trim().toUpperCase() || "MXN";
    const stock = Math.max(0, asInt(body.stock, 0));
    const active = toBool(body.active, true);
    const meta = asJsonObject(body.meta);

    const { data, error } = await ctx.sb
      .from("supply_products")
      .insert({
        project_id: ctx.project_id,
        sku,
        name,
        description,
        price_cents,
        cost_cents,
        currency,
        stock,
        active,
        meta,
      })
      .select("*")
      .single();

    if (error) {
      throw new ApiError(500, { error: `No se pudo crear el producto: ${getErrorMessage(error)}` });
    }

    return json({ ok: true, item: data }, 201);
  } catch (err: unknown) {
    const ex = toApiError(err);
    return json(ex.payload, ex.status);
  }
}