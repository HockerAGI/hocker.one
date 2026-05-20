import { z } from "zod";
import { getRuntimeToolCatalog } from "@/lib/agi-runtime-core";
import { buildNovaProductionGateContext, getAgiQueueLock } from "@/lib/agi-queue-lock";
import { buildNovaCapabilitiesReply, buildNovaChatCapabilitiesContext, buildNovaUpstreamRuntimeContext, shouldAnswerCapabilitiesLocally } from "@/lib/hocker-tool-router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const StreamChatSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  thread_id: z.string().uuid().nullable().optional(),
  message: z.string().min(1),
  mode: z.enum(["auto", "fast", "pro"]).default("auto"),
  allow_actions: z.boolean().default(false),
  tools_requested: z.array(z.string()).default([]),
  context_data: z.record(z.unknown()).optional(),
});

type NovaChatResponse = {
  ok?: boolean;
  reply?: string;
  error?: string;
  trace_id?: string | null;
  actions?: unknown[];
  meta?: Record<string, unknown>;
};

const encoder = new TextEncoder();

function sse(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function getNovaBaseUrl(): string {
  return String(process.env.NOVA_AGI_URL ?? "").trim().replace(/\/$/, "");
}

function getNovaKey(): string {
  return String(process.env.NOVA_ORCHESTRATOR_KEY ?? "").trim();
}

function safeContext(body: z.infer<typeof StreamChatSchema>, productionGateContext: Record<string, unknown>) {
  const capabilitiesContract = buildNovaChatCapabilitiesContext(String(body.message ?? ""), body.project_id);
  const upstreamRuntimeContext = buildNovaUpstreamRuntimeContext(capabilitiesContract, productionGateContext);
  const tools = getRuntimeToolCatalog().map((tool) => ({
    tool_key: tool.tool_key,
    name: tool.name,
    provider: tool.provider,
    status: tool.status,
    supports_read: tool.supports_read,
    supports_write: tool.supports_write,
    supports_realtime: tool.supports_realtime,
    execution_enabled: tool.execution_enabled,
  }));

  return {
    ...body,
    mode: "auto",
    allow_actions: false,
    tools_requested: [],
    context_data: {
      ...(body.context_data ?? {}),
      hocker_runtime: {
        mode: "agi_runtime_core_12_7c_1",
        realtime_requested: true,
        integrations: tools,
        rule: "No iniciar tareas nuevas con cola pendiente. No ejecutar acciones sensibles sin Owner Gate, pruebas, auditoría y autorización final.",
        ...upstreamRuntimeContext,
      },
    },
  };
}

async function emitFallbackChat(
  controller: ReadableStreamDefaultController<Uint8Array>,
  payload: z.infer<typeof StreamChatSchema>,
  productionGateContext: Record<string, unknown>,
) {
  const baseUrl = getNovaBaseUrl();
  const key = getNovaKey();
  const res = await fetch(`${baseUrl}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Hocker-Source": "hocker.one.realtime-production-gate-fallback",
    },
    body: JSON.stringify(safeContext(payload, productionGateContext)),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as NovaChatResponse;
  if (!res.ok || data.error) {
    controller.enqueue(sse("error", { ok: false, error: data.error ?? `NOVA HTTP ${res.status}`, trace_id: data.trace_id ?? null }));
    return;
  }

  controller.enqueue(sse("message", {
    ok: true,
    type: "final",
    content: data.reply ?? "",
    actions: [],
    meta: { ...(data.meta ?? {}), ...productionGateContext },
    transport: "single_response",
  }));
}

export async function POST(req: Request): Promise<Response> {
  const baseUrl = getNovaBaseUrl();
  const key = getNovaKey();

  if (!baseUrl || !key) {
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(sse("error", { ok: false, error: "NOVA no está configurada en producción." }));
          controller.enqueue(sse("done", { ok: false }));
          controller.close();
        },
      }),
      { status: 500, headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }

  const parsed = StreamChatSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: "Payload inválido para Hablar con NOVA.", issues: parsed.error.flatten() }), { status: 400 });
  }

  const queueLock = await getAgiQueueLock(parsed.data.project_id);
  const productionGateContext = buildNovaProductionGateContext(queueLock);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), 55_000);

      try {
        controller.enqueue(sse("meta", {
          ok: true,
          transport: "hocker.one.sse.production_gate",
          realtime_requested: true,
          ...productionGateContext,
        }));

        if (shouldAnswerCapabilitiesLocally(parsed.data.message)) {
          const capabilitiesContract = buildNovaChatCapabilitiesContext(parsed.data.message, parsed.data.project_id);
          controller.enqueue(sse("message", {
            ok: true,
            type: "final",
            content: buildNovaCapabilitiesReply(capabilitiesContract),
            actions: [],
            meta: { ...productionGateContext, capabilities_contract: capabilitiesContract },
            transport: "local_capabilities_contract",
          }));
          controller.enqueue(sse("done", { ok: true }));
          return;
        }

        const upstream = await fetch(`${baseUrl}/api/v1/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            Authorization: `Bearer ${key}`,
            "X-Hocker-Source": "hocker.one.realtime-production-gate",
          },
          body: JSON.stringify(safeContext(parsed.data, productionGateContext)),
          signal: abort.signal,
          cache: "no-store",
        }).catch(() => null);

        const upstreamType = upstream?.headers.get("content-type") || "";
        if (upstream?.ok && upstream.body && upstreamType.includes("text/event-stream")) {
          for await (const chunk of upstream.body as unknown as AsyncIterable<Uint8Array>) {
            controller.enqueue(chunk);
          }
        } else {
          await emitFallbackChat(controller, parsed.data, productionGateContext);
        }

        controller.enqueue(sse("done", { ok: true }));
      } catch (error) {
        const isTimeout = error instanceof Error && error.name === "AbortError";
        controller.enqueue(sse("error", { ok: false, error: isTimeout ? "Timeout: NOVA excedió 55s." : error instanceof Error ? error.message : "Fallo realtime con NOVA." }));
        controller.enqueue(sse("done", { ok: false }));
      } finally {
        clearTimeout(timeout);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
