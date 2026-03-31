import { NextResponse } from "next/server";
import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request) {
  const trace = langfuse.trace({
    name: "NOVA_Conexion_Nucleo",
    metadata: { endpoint: "/api/nova" },
  });

  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? "global").trim();
    const thread_id = body.thread_id ? String(body.thread_id).trim() : null;
    const message = String(body.message ?? "").trim();
    const mode = body.mode ? String(body.mode).trim() : "chat";
    const prefer = body.prefer ? String(body.prefer).trim() : null;

    if (!message) {
      throw new ApiError(400, { error: "El canal de comunicación no puede procesar una transmisión en blanco." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    trace.update({
      userId: ctx.user.id,
      tags: [project_id, mode, "nova_query"],
    });

    const url = process.env.NOVA_AGI_URL;
    const key = process.env.NOVA_ORCHESTRATOR_KEY;

    if (!url || !key) {
      throw new ApiError(500, { error: "Falla de infraestructura: el enlace con el cerebro central no está configurado." });
    }

    const allowActions = ctx.role === "owner" || ctx.role === "admin";

    trace.event({
      name: "Peticion_Transmitida_Al_Nucleo",
      input: { thread_id, mode, allowActions, user: ctx.user.email },
    });

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
      const errText = await upstream.text().catch(() => "Anomalía de respuesta.");
      throw new ApiError(upstream.status, {
        error: `Anomalía táctica desde el núcleo de NOVA: ${errText || upstream.statusText}`,
      });
    }

    const text = await upstream.text();

    trace.event({ name: "Respuesta_Recibida", output: { length: text.length } });
    trace.event({ name: "OPERACION_EXITOSA" });

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-NOVA-Sync": "Stable",
      },
    });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    console.error("[NOVA Core] Fallo en el puente de comunicación:", apiErr.message);

    trace.event({
      name: "FALLA_CONEXION",
      level: "ERROR",
      output: { error: getErrorMessage(err) },
    });

    return json(apiErr.body, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}