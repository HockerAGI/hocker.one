import { NextResponse } from "next/server";
import { Langfuse } from "langfuse-node";
import { getErrorMessage } from "@/lib/errors";
import { NOVA_PROFILE } from "@/lib/novaPersona";
import { ApiError, json, parseBody, requireProjectRole, toApiError } from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

type NovaUpstreamResponse = {
  reply?: string;
  response?: string;
  ok?: boolean;
  error?: string;
};

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "NOVA_Conexion_Nucleo",
    metadata: { endpoint: "/api/nova/chat" },
  });

  try {
    const body = await parseBody(req);

    const project_id = String(body.project_id ?? body.projectId ?? "").trim();
    const thread_id = typeof body.thread_id === "string" ? body.thread_id.trim() : null;
    const message = String(body.message ?? "").trim();
    const mode = typeof body.mode === "string" ? body.mode.trim() : "chat";
    const prefer = typeof body.prefer === "string" ? body.prefer.trim() : "human";

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    if (!message) {
      throw new ApiError(400, {
        error: "El canal de comunicación no puede procesar una transmisión en blanco.",
      });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);

    trace.update({
      userId: ctx.user.id,
      tags: [project_id, mode, "nova_query"],
    });

    const url = process.env.NOVA_AGI_URL;
    const key = process.env.NOVA_ORCHESTRATOR_KEY;

    if (!url || !key) {
      throw new ApiError(500, {
        error: "Falla de infraestructura: el enlace con el cerebro central no está configurado.",
      });
    }

    const allowActions = ctx.role === "owner" || ctx.role === "admin";

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
        persona: NOVA_PROFILE.name,
        style: NOVA_PROFILE.styleHint,
        system_prompt: NOVA_PROFILE.systemPrompt,
        voice_profile: {
          locale: NOVA_PROFILE.locale,
          label: NOVA_PROFILE.voiceLabel,
        },
        user_id: ctx.user.id,
        user_email: ctx.user.email ?? null,
      }),
    });

    const raw = await upstream.text();
    let reply = raw;

    try {
      const parsed = JSON.parse(raw) as NovaUpstreamResponse;
      reply = readText(parsed.reply) || readText(parsed.response) || raw;
    } catch {
      // upstream puede responder texto plano; lo dejamos así
    }

    trace.event({ name: "Respuesta_Recibida", output: { length: reply.length } });
    trace.event({ name: "OPERACION_EXITOSA" });

    return json(
      {
        ok: true,
        reply,
      },
      upstream.ok ? 200 : upstream.status,
    );
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    console.error("[NOVA Core] Fallo en el puente de comunicación:", apiErr.message);

    trace.event({
      name: "FALLA_CONEXION",
      level: "ERROR",
      output: { error: getErrorMessage(err) },
    });

    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}