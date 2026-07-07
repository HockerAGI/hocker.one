import { getErrorMessage } from "@/lib/errors";
import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError, getControls } from "../../_lib";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateProductSchema = z.object({
  project_id: z.string().min(1),
  name: z.string().min(1).max(200),
  sku: z.string().max(60).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  price_cents: z.number().int().nonnegative().max(100000000).default(0),
  cost_cents: z.number().int().nonnegative().max(100000000).default(0),
  currency: z.string().max(3).default("MXN"),
  stock: z.number().int().nonnegative().max(10000000).default(0),
  active: z.boolean().default(true),
  meta: z.record(z.unknown()).optional(),
});

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
    const rawBody = await parseBody(req);
    const parsed = CreateProductSchema.safeParse(rawBody);

    if (!parsed.success) {
      throw new ApiError(400, { error: "Estructura del producto rechazada.", issues: parsed.error.flatten() });
    }

    const body = parsed.data;
    const project_id = body.project_id;

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    const controls = await getControls(ctx.sb, ctx.project_id);

    if (controls.kill_switch) {
      throw new ApiError(423, { error: "Kill Switch activo. No se puede modificar supply." });
    }

    if (!controls.allow_write) {
      throw new ApiError(403, { error: "Modo solo lectura activo." });
    }

    const name = body.name;
    const sku = body.sku ?? null;
    const description = body.description ?? null;
    const price_cents = body.price_cents;
    const cost_cents = body.cost_cents;
    const currency = body.currency.toUpperCase();
    const stock = body.stock;
    const active = body.active;
    const meta = body.meta ?? {};

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