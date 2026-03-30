import { getErrorMessage } from "@/lib/errors";
import { ApiError, getControls, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

// Inicialización de la Caja Negra (Telemetría Financiera y Logística)
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

// Normalizador matemático de seguridad
function asInt(v: any, def = 0) {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : def;
}

// PROTOCOLO DE LECTURA (Listado General de Suministros)
export async function GET(req: Request) {
  const trace = langfuse.trace({ name: "Logistica_Listado_Ordenes", metadata: { endpoint: "/api/supply_orders" } });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();
    const include_items = q.get("include_items") === "1";

    // Auditoría de acceso permitida a espectadores tácticos
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "logistica", "lectura"] });

    // Alternador inteligente de consultas anidadas
    const select = include_items ? "*, items:supply_order_items(*)" : "*";

    const { data, error } = await ctx.sb
      .from("supply_orders")
      .select(select)
      .eq("project_id", ctx.project_id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new ApiError(500, { error: "Falla de enlace al consultar el registro logístico general." });

    trace.event({ name: "LECTURA_EXITOSA" });
    return json({ ok: true, items: data ?? [] });

  } catch (e: any) {
    const ex = toApiError(e);
    trace.event({ name: "ERROR_LECTURA_LOGISTICA", level: "ERROR", output: { error: ex.payload } });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}

// PROTOCOLO DE CREACIÓN (Inyección de Nuevas Órdenes)
export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Logistica_Creacion_Orden", metadata: { endpoint: "/api/supply_orders" } });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "global").trim();

    // Autoridad para crear flujos de suministro
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "finance", "logistica"] });

    // Escudo de Gobernanza Central
    const controls = await getControls(ctx.sb, ctx.project_id);
    if (controls.kill_switch) {
      throw new ApiError(423, { error: "BLOQUEO GENERAL: Kill Switch Activo. Creación de órdenes logísticas suspendida." });
    }
    if (!controls.allow_write) {
      throw new ApiError(403, { error: "MODO SEGURO: El sistema está en solo lectura. Activa los permisos de escritura en la sección de Seguridad." });
    }

    // Extracción y saneamiento de datos
    const customer_name = body.customer_name ? String(body.customer_name).trim() : null;
    const customer_phone = body.customer_phone ? String(body.customer_phone).trim() : null;
    const status = String(body.status || "pending").trim();
    const currency = String(body.currency || "MXN").trim().toUpperCase();
    const meta = body.meta && typeof body.meta === "object" ? body.meta : {};

    // Validación táctica del inventario
    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    if (!itemsRaw.length) throw new ApiError(400, { error: "Anomalía en la orden: Se requiere al menos un artículo en la lista para procesar el suministro." });

    // Normalización financiera (Protección contra inyección de números negativos)
    const items = itemsRaw.map((it: any) => ({
      product_id: it.product_id ? String(it.product_id).trim() : null,
      qty: Math.max(1, asInt(it.qty, 1)),
      unit_price_cents: Math.max(0, asInt(it.unit_price_cents, 0)),
    }));

    // Ejecución atómica en la base de datos a través de RPC (Procedimiento Almacenado)
    const { data, error } = await ctx.sb.rpc("supply_create_order", {
      p_project_id: ctx.project_id,
      p_status: status,
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
      p_currency: currency,
      p_meta: meta,
      p_items: items,
    });

    if (error) throw new ApiError(500, { error: "Falla crítica al intentar registrar la transacción y los artículos en la matriz de datos.", details: getErrorMessage(error) });

    trace.event({ name: "ORDEN_REGISTRADA_CON_EXITO", input: { order_id: data, status } });
    trace.event({ name: "OPERACION_EXITOSA" });

    // Devolvemos el ID de la orden generada
    return json({ ok: true, id: data });

  } catch (e: any) {
    const ex = toApiError(e);
    trace.event({ name: "ERROR_CREACION_LOGISTICA", level: "ERROR", output: { error: ex.payload } });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}
