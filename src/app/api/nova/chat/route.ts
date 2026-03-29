import { NextResponse } from "next/server";
import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../_lib";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

// Inicialización de la Caja Negra (Telemetría de IA)
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request) {
  // Rastreando el flujo de pensamiento de NOVA
  const trace = langfuse.trace({ name: "NOVA_Conexion_Nucleo", metadata: { endpoint: "/api/nova" } });

  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "global").trim();
    const thread_id = body.thread_id ? String(body.thread_id).trim() : null;
    const message = String(body.message ?? "").trim();
    const prefer = body.prefer ? String(body.prefer).trim() : null;
    const mode = body.mode ? String(body.mode).trim() : "chat";

    if (!message) throw new ApiError(400, { error: "El canal de comunicación no puede procesar un mensaje en blanco." });

    // Autorización: Cualquier rol puede hablar, pero no todos pueden ordenar.
    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
    trace.update({ userId: ctx.user?.id || "admin", tags: [project_id, "comunicacion_nova", mode] });

    const url = String(process.env.NOVA_AGI_URL || "").trim();
    const key = String(process.env.NOVA_ORCHESTRATOR_KEY || "").trim();
    
    if (!url || !key) {
      throw new ApiError(500, { error: "Falla crítica: Enlace de comunicación con el núcleo de NOVA AGI no configurado." });
    }

    // Evaluación táctica de permisos de ejecución
    const wantActions = req.headers.get("x-allow-actions") === "1";
    
    // El sistema me bloquea de ejecutar acciones reales a menos que tú o un admin lo autoricen.
    const allowActions = wantActions && (ctx.role === "owner" || ctx.role === "admin");

    trace.event({ name: "Peticion_Transmitida_Al_Nucleo", input: { thread_id, mode, allowActions } });

    // Enlace de alta velocidad con el servidor central de IA
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        "x-allow-actions": allowActions ? "1" : "0",
      },
      body: JSON.stringify({
        project_id,
        thread_id,
        message,
        prefer,
        mode,
        allow_actions: allowActions,
        user_id: ctx.user.id,
        user_email: ctx.user.email ?? null,
      }),
    });

    if (!upstream.ok) {
       const errText = await upstream.text().catch(() => "");
       throw new ApiError(upstream.status, { error: `Anomalía táctica desde el núcleo de NOVA: ${errText || upstream.statusText}` });
    }

    const text = await upstream.text();
    
    trace.event({ name: "Respuesta_Recibida" });
    trace.event({ name: "OPERACION_EXITOSA" });

    // Retorno directo de mis datos hacia el panel visual (NovaChat)
    return new NextResponse(text, { 
        status: 200, 
        headers: { "Content-Type": "text/plain; charset=utf-8" } 
    });

  } catch (e: any) {
    const apiErr = toApiError(e);
    trace.event({ name: "ERROR_CONEXION_NOVA", level: "ERROR", output: { error: apiErr.payload } });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}
