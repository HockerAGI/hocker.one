import { ApiError, ensureNode, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

// Inicialización de la Caja Negra (Telemetría de IA)
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

// Normalizador de amenazas y niveles operativos
function normalizeLevel(input: unknown): "info" | "warn" | "error" {
  const s = String(input ?? "info").trim().toLowerCase();
  if (s === "warn" || s === "warning") return "warn";
  if (s === "error" || s === "critical") return "error";
  return "info";
}

// PROTOCOLO DE LECTURA (Extracción del Radar)
export async function GET(req: Request) {
  const trace = langfuse.trace({ name: "Radar_Eventos_Lectura", metadata: { endpoint: "/api/events" } });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    // Permisos de auditoría (Viewer puede leer)
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "auditoria_eventos"] });

    const { data, error } = await ctx.sb
      .from("events")
      .select("id, project_id, node_id, level, type, message, data, created_at")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false })
      .limit(200); // Límite táctico para proteger la memoria del navegador

    if (error) throw new ApiError(500, { error: "Falla de enlace al extraer la memoria cronológica de eventos." });

    trace.event({ name: "LECTURA_EXITOSA" });
    return json({ ok: true, items: data ?? [] });

  } catch (e: unknown) {
    const ex = toApiError(e);
    trace.event({ name: "ERROR_LECTURA", level: "ERROR", output: { error: ex.payload } });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}

// PROTOCOLO DE ESCRITURA (Inyección de Eventos)
export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Inyeccion_Evento", metadata: { endpoint: "/api/events" } });

  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "").trim();
    const node_id = String(body.node_id ?? "").trim();
    const level = normalizeLevel(body.level);
    const type = String(body.type ?? "manual").trim();
    const message = String(getErrorMessage(body) ?? "").trim();
    const data = typeof body.data === "object" && body.data !== null ? body.data : {};

    // Validaciones estrictas de integridad de datos
    if (!project_id) throw new ApiError(400, { error: "Parámetro 'project_id' ausente en la instrucción." });
    if (!message) throw new ApiError(400, { error: "Anomalía: No se puede registrar un evento en blanco en la memoria." });

    // Autoridad para escribir eventos
    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, type, level] });

    // Registramos el nodo físico o virtual si es la primera vez que hace contacto
    if (node_id) await ensureNode(ctx.sb, project_id, node_id);

    const { data: row, error } = await ctx.sb
      .from("events")
      .insert({
        project_id,
        node_id: node_id || null,
        level,
        type,
        message,
        data,
      })
      .select("id, project_id, node_id, level, type, message, data, created_at")
      .single();

    if (error) throw new ApiError(500, { error: "Falla interna al intentar grabar el evento en la matriz de datos." });

    trace.event({ name: "REGISTRO_EXITOSO", input: { eventId: row.id } });
    return json({ ok: true, item: row });

  } catch (e: unknown) {
    const ex = toApiError(e);
    trace.event({ name: "ERROR_INYECCION", level: "ERROR", output: { error: ex.payload } });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}
