import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ChatSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  thread_id: z.string().uuid().nullable().optional(),
  message: z.string().min(1),
  prefer: z.string().optional().transform(() => "auto"),
  mode: z.enum(["auto", "fast", "pro"]).default("auto"),
  allow_actions: z.boolean().default(false),
  user_id: z.string().nullable().optional(),
  user_email: z.string().email().nullable().optional(),
  context_data: z.record(z.unknown()).optional(),
});

type NovaChatResponse = {
  ok: boolean;
  project_id?: string;
  thread_id?: string;
  reply?: string;
  provider?: string;
  model?: string;
  intent?: string;
  agi_id?: string;
  actions?: unknown[];
  trace_id?: string | null;
  meta?: Record<string, unknown>;
  error?: string;
};

function getNovaBaseUrl(): string {
  return String(process.env.NOVA_AGI_URL ?? "").trim().replace(/\/$/, "");
}

function getNovaKey(): string {
  return String(process.env.NOVA_ORCHESTRATOR_KEY ?? "").trim();
}

function sanitizeNovaPayload(payload: NovaChatResponse): Record<string, unknown> {
  if (!payload.ok) {
    return {
      ok: false,
      error: payload.error ?? "NOVA no pudo completar la solicitud.",
      trace_id: payload.trace_id ?? null,
    };
  }

  const controls =
    payload.meta &&
    typeof payload.meta.controls === "object" &&
    payload.meta.controls !== null &&
    !Array.isArray(payload.meta.controls)
      ? (payload.meta.controls as Record<string, unknown>)
      : {};

  return {
    ok: true,
    project_id: payload.project_id,
    thread_id: payload.thread_id,
    reply: payload.reply ?? "",
    intent: payload.intent,
    agi_id: payload.agi_id,
    actions: Array.isArray(payload.actions) ? payload.actions : [],
    trace_id: payload.trace_id ?? null,
    meta: {
      reason: payload.meta?.reason,
      agi_registry: payload.meta?.agi_registry,
      controls: {
        allow_write: controls.allow_write,
        requested_actions: controls.requested_actions,
        enqueued_actions: controls.enqueued_actions,
        action_policy: controls.action_policy,
      },
      context_data: payload.meta?.context_data ?? {},
    },
  };
}

export async function POST(req: Request): Promise<Response> {
  const baseUrl = getNovaBaseUrl();
  const key = getNovaKey();

  if (!baseUrl || !key) {
    return NextResponse.json(
      { ok: false, error: "NOVA no está configurada en el entorno de producción." },
      { status: 500 },
    );
  }

  const jsonBody: unknown = await req.json().catch(() => ({}));
  const parsed = ChatSchema.safeParse(jsonBody);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Payload inválido para NOVA.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55_000);

  try {
    const res = await fetch(`${baseUrl}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Hocker-Source": "hocker.one",
      },
      body: JSON.stringify(parsed.data),
      signal: controller.signal,
      cache: "no-store",
    });

    const responseJson = (await res.json().catch(() => ({}))) as NovaChatResponse;
    const safePayload = sanitizeNovaPayload(responseJson);

    return NextResponse.json(safePayload, {
      status: res.status,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        ok: false,
        error: isTimeout
          ? "Timeout: NOVA excedió la ventana de respuesta de 55s."
          : error instanceof Error
            ? error.message
            : "Fallo de conexión con NOVA.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
