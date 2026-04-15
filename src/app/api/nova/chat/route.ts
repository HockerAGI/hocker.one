import { NextResponse } from "next/server";
import { z } from "zod";

// Ejecución perimetral (Edge) para latencia nula y evitar cold-starts severos
export const runtime = "edge";
export const maxDuration = 60;

const ChatSchema = z.object({
  project_id: z.string().min(1).default("global"),
  thread_id: z.string().uuid().optional(),
  message: z.string().min(1),
  prefer: z.enum(["auto", "openai", "gemini"]).default("auto"),
  mode: z.enum(["auto", "fast", "pro"]).default("auto"),
  allow_actions: z.boolean().default(false),
  user_id: z.string().nullable().optional(),
  user_email: z.string().email().nullable().optional(),
});

type NovaChatResponse = {
  ok: boolean;
  thread_id?: string;
  reply?: string;
  provider?: string;
  model?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
};

function getNovaBaseUrl(): string {
  return String(process.env.NOVA_AGI_URL ?? "").trim();
}

function getNovaKey(): string {
  return String(process.env.NOVA_ORCHESTRATOR_KEY ?? "").trim();
}

export async function POST(req: Request): Promise<Response> {
  const baseUrl = getNovaBaseUrl();
  const key = getNovaKey();

  if (!baseUrl || !key) {
    return NextResponse.json(
      {
        ok: false,
        error: "Fallo crítico: NOVA_AGI_URL o NOVA_ORCHESTRATOR_KEY no configurados.",
      },
      { status: 500 },
    );
  }

  const jsonBody: unknown = await req.json().catch(() => ({}));
  const parsed = ChatSchema.safeParse(jsonBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Anomalía estructural en el payload enviado.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  // CUELLO DE BOTELLA ELIMINADO: Extensión a 55s para inferencia profunda.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  try {
    const res = await fetch(new URL("/chat", baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Hocker-Source": "hocker.one",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const responseJson = (await res.json().catch(() => ({}))) as NovaChatResponse;

    return NextResponse.json(responseJson, {
      status: res.status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    
    return NextResponse.json(
      {
        ok: false,
        error: isTimeout 
          ? "Timeout: La inferencia superó el umbral de seguridad de tiempo." 
          : (error instanceof Error ? error.message : "Fallo de conexión profunda con nova.agi."),
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}