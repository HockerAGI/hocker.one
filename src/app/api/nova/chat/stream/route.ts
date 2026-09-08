import { z } from "zod";
import { getRuntimeToolCatalog } from "@/lib/agi-runtime-core";
import { buildNovaProductionGateContext, getAgiQueueLock } from "@/lib/agi-queue-lock";
import { requireProjectRole } from "@/app/api/_lib";
import { runToolEnabledUnifiedNovaChat } from "@/lib/unified-nova-chat-runtime";
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

  const parsed = StreamChatSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ ok: false, error: "Payload inválido para Hablar con NOVA.", issues: parsed.error.flatten() }), { status: 400 });
  }

  let chatCtx;
  try {
    chatCtx = await requireProjectRole(parsed.data.project_id, ["owner", "admin", "operator", "viewer"]);
  } catch (error) {
    const response = error instanceof Error ? error.message : "No autorizado.";
    return new Response(JSON.stringify({ ok: false, error: response }), { status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }

  const queueLock = await getAgiQueueLock(chatCtx.project_id);
  const productionGateContext = buildNovaProductionGateContext(queueLock);

  // API-03: Use the request's AbortSignal to detect client disconnect
  const clientSignal = req.signal;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), 55_000);

      // Listen for client disconnect to abort upstream fetch
      const onClientDisconnect = () => {
        abort.abort();
      };
      clientSignal.addEventListener("abort", onClientDisconnect, { once: true });

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

        try {
          const local = await runToolEnabledUnifiedNovaChat({
            project_id: chatCtx.project_id,
            thread_id: parsed.data.thread_id,
            message: parsed.data.message,
            user_id: chatCtx.user.id,
            user_email: chatCtx.user.email ?? null,
            context_data: parsed.data.context_data,
            allow_actions: false,
            oidc_token: req.headers.get("x-vercel-oidc-token"),
          });
          controller.enqueue(sse("message", {
            ok: true,
            type: "final",
            content: String(local.reply ?? ""),
            citations: Array.isArray(local.citations) ? local.citations : [],
            actions: [],
            meta: { ...(local.meta ?? {}), ...productionGateContext },
            transport: "hocker-one-unified-final-sse",
          }));
          controller.enqueue(sse("done", { ok: true }));
          return;
        } catch {
          // Continue to the dedicated compatibility fallback only if the unified runtime fails.
        }

        if (!baseUrl || !key) {
          controller.enqueue(sse("error", { ok: false, error: "NOVA no pudo completar la solicitud con las rutas disponibles." }));
          controller.enqueue(sse("done", { ok: false }));
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
            // Check if client disconnected mid-stream
            if (clientSignal.aborted) break;
            controller.enqueue(chunk);
          }
        } else {
          await emitFallbackChat(controller, parsed.data, productionGateContext);
        }

        controller.enqueue(sse("done", { ok: true }));
      } catch (error) {
        const isTimeout = error instanceof Error && error.name === "AbortError";
        const isClientDisconnect = clientSignal.aborted;
        if (isClientDisconnect) {
          // Client left, no need to send error events
          return;
        }
        controller.enqueue(sse("error", { ok: false, error: isTimeout ? "Timeout: NOVA excedió 55s." : error instanceof Error ? error.message : "Fallo realtime con NOVA." }));
        controller.enqueue(sse("done", { ok: false }));
      } finally {
        clearTimeout(timeout);
        clientSignal.removeEventListener("abort", onClientDisconnect);
        try { controller.close(); } catch { /* already closed */ }
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
