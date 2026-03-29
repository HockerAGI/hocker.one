import { ApiError, getControls, json, parseBody, parseQuery, requireProjectRole, toApiError } from "../../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

// Inicialización de la Caja Negra (Telemetría de IA)
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

// PROTOCOLO DE LECTURA (Estado del Escudo)
export async function GET(req: Request) {
  const trace = langfuse.trace({ name: "Gobernanza_Protocolo_Lectura", metadata: { endpoint: "/api/governance" } });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") || "global").trim();

    // Auditores y operadores pueden ver el estado del escudo
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "auditoria_seguridad"] });

    const controls = await getControls(ctx.sb, project_id);
    
    trace.event({ name: "LECTURA_EXITOSA" });
    return json({ ok: true, controls });

  } catch (e: any) {
    const ex = toApiError(e);
    trace.event({ name: "ERROR_LECTURA_GOBERNANZA", level: "ERROR", output: { error: ex.payload } });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}

// PROTOCOLO DE ESCRITURA (Activación de Defensas)
export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Gobernanza_Actualizacion_Protocolo", metadata: { modulo: "VERTX_SECURITY" } });

  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "").trim();
    if (!project_id) throw new ApiError(400, { error: "Parámetro 'project_id' requerido para modificar protocolos." });

    // SOLO el Director (owner) o un administrador pueden tocar el Botón Nuclear
    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "alerta_seguridad"] });

    // Obtenemos el estado actual antes de modificarlo
    const current = await getControls(ctx.sb, project_id);

    // Calculamos el nuevo estado táctico
    const nextKill =
      typeof body.kill_switch === "boolean"
        ? body.kill_switch
        : body.kill_switch === "toggle"
            ? !current.kill_switch
            : current.kill_switch;

    const nextAllow =
      typeof body.allow_write === "boolean"
        ? body.allow_write
        : current.allow_write;

    const updated_at = new Date().toISOString();

    // Sellamos el nuevo protocolo en la matriz
    const { error } = await ctx.sb.from("system_controls").upsert(
      {
        id: "global",
        project_id,
        kill_switch: nextKill,
        allow_write: nextAllow,
        updated_at,
      },
      { onConflict: "id,project_id" }
    );

    if (error) throw new ApiError(500, { error: "Falla crítica al inyectar el nuevo nivel de seguridad en la matriz.", details: error.message });

    // Generamos el mensaje táctico para el Radar de Eventos (EventsFeed)
    let mensajeRadar = "";
    if (nextKill) mensajeRadar = "ALERTA MÁXIMA: Kill Switch ACTIVADO. Sistema congelado.";
    else if (!nextAllow) mensajeRadar = "MODO DEFENSA: Escritura denegada. Sistema en modo solo lectura.";
    else mensajeRadar = "NORMALIZACIÓN: Protocolos de seguridad restaurados. Operación nominal.";

    // Guardamos el movimiento en la memoria cronológica
    await ctx.sb.from("events").insert({
      project_id,
      node_id: "hocker-fabric", // Lo marca como una orden desde la central
      level: nextKill ? "critical" : !nextAllow ? "warn" : "info",
      type: "governance.protocol.updated",
      message: mensajeRadar,
      data: { kill_switch: nextKill, allow_write: nextAllow, user: ctx.user.id },
    });

    // Auditoría en la Caja Negra (Langfuse)
    trace.event({
      name: "Nivel_Amenaza_Modificado",
      level: nextKill ? "WARNING" : "DEFAULT",
      input: { kill_switch: nextKill, allow_write: nextAllow },
    });

    const controls = await getControls(ctx.sb, project_id);
    trace.event({ name: "OPERACION_EXITOSA" });
    
    return json({ ok: true, controls });

  } catch (e: any) {
    const ex = toApiError(e);
    trace.event({ name: "ERROR_INYECCION_GOBERNANZA", level: "ERROR", output: { error: ex.payload } });
    return json(ex.payload, ex.status);
  } finally {
    await langfuse.flushAsync();
  }
}
