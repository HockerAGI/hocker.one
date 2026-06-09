import { NextResponse } from "next/server";
import { z } from "zod";
import { buildNovaProductionGateContext, getAgiQueueLock } from "@/lib/agi-queue-lock";
import { requireProjectRole } from "@/app/api/_lib";
import { buildNovaChatActionDraftPreview } from "@/lib/nova-chat-action-drafts";
import { materializeNovaGitHubActionsFromChat } from "@/lib/nova-github-action-materializer";
import { buildNovaCapabilitiesReply, buildNovaChatCapabilitiesContext, buildNovaUpstreamRuntimeContext, shouldAnswerCapabilitiesLocally } from "@/lib/hocker-tool-router";

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

function sanitizeNovaPayload(payload: NovaChatResponse, injectedMeta: Record<string, unknown>, localActionDraft: Record<string, unknown> | null = null): Record<string, unknown> {
  if (!payload.ok) {
    return {
      ok: false,
      error: payload.error ?? "NOVA no pudo completar la solicitud.",
      trace_id: payload.trace_id ?? null,
      meta: injectedMeta,
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
    actions: localActionDraft ? [localActionDraft] : [],
    trace_id: payload.trace_id ?? null,
    meta: {
      reason: payload.meta?.reason,
      agi_registry: payload.meta?.agi_registry,
      syntia_memory: payload.meta?.syntia_memory,
      syntia_memory_items: payload.meta?.syntia_memory_items,
      controls: {
        allow_write: false,
        requested_actions: false,
        enqueued_actions: localActionDraft ? [localActionDraft] : [],
        action_policy: localActionDraft ? "nova_chat_action_draft_12_7j_no_execution" : "production_gate_12_7c_1_chat_does_not_enqueue_actions",
        upstream_requested_actions: controls.requested_actions,
      },
      context_data: payload.meta?.context_data ?? {},
      chat_action_draft: localActionDraft,
      ...injectedMeta,
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

  const queueLock = await getAgiQueueLock(parsed.data.project_id);
  const productionGateContext = buildNovaProductionGateContext(queueLock);
  const capabilitiesContract = buildNovaChatCapabilitiesContext(parsed.data.message, parsed.data.project_id);
  const injectedMeta = { ...productionGateContext, capabilities_contract: capabilitiesContract };
  const upstreamRuntimeContext = buildNovaUpstreamRuntimeContext(capabilitiesContract, productionGateContext);

  let localActionDraft: Record<string, unknown> | null = null;
  const draftPreview = buildNovaChatActionDraftPreview({
    project_id: parsed.data.project_id,
    message: parsed.data.message,
    queue_lock: queueLock,
  });

  if (draftPreview && parsed.data.allow_actions) {
    const ctx = await requireProjectRole(parsed.data.project_id, ["owner", "admin", "operator"]);
    localActionDraft = await materializeNovaGitHubActionsFromChat({
      project_id: ctx.project_id,
      message: parsed.data.message,
      queue_lock: queueLock,
      created_by: /^[0-9a-fA-F-]{36}$/.test(String(ctx.user.id ?? "")) ? ctx.user.id : null,
    }) as Record<string, unknown> | null;
  } else if (draftPreview) {
    localActionDraft = draftPreview as Record<string, unknown>;
  }

  if (localActionDraft) {
    const draft = localActionDraft as Record<string, unknown>;
    const enqueued = draft.enqueued === true;
    const materialized = draft.materialized === true;
    const scope = String(draft.scope ?? "general_action");
    const ownerAgi = String(draft.owner_agi ?? "nova");

    return Response.json({
      ok: true,
      project_id: parsed.data.project_id,
      thread_id: null,
      reply: materialized
        ? "Preparé acciones GitHub reales en cola segura. No ejecuté nada: quedaron esperando autorización Owner Gate."
        : enqueued
          ? "Preparé un borrador seguro desde NOVA Chat y lo dejé pendiente de revisión. No ejecuté nada."
          : "Preparé un preview seguro de acción desde NOVA Chat. No encolé ni ejecuté nada.",
      intent: "action_draft",
      agi_id: ownerAgi,
      actions: [localActionDraft],
      trace_id: null,
      meta: {
        reason: "Respuesta local 12.7J-1A: los borradores de acción se responden desde Hocker ONE sin depender del upstream.",
        controls: {
          allow_write: false,
          requested_actions: true,
          enqueued_actions: enqueued ? [localActionDraft] : [],
          action_policy: materialized
            ? "nova_github_materialized_actions_waiting_owner_gate"
            : enqueued
              ? "nova_chat_action_draft_enqueued_no_execution"
              : "nova_chat_action_draft_preview_no_execution",
          upstream_requested_actions: false,
          upstream_called: false,
        },
        chat_action_draft: localActionDraft,
        action_scope: scope,
        ...injectedMeta,
      },
    });
  }

  if (shouldAnswerCapabilitiesLocally(parsed.data.message)) {
    return NextResponse.json(
      {
        ok: true,
        project_id: parsed.data.project_id,
        thread_id: parsed.data.thread_id ?? null,
        reply: buildNovaCapabilitiesReply(capabilitiesContract),
        intent: "capabilities",
        agi_id: "nova",
        actions: [],
        trace_id: null,
        meta: {
          reason: "Respuesta local desde capabilities_contract. No se llamó a nova.agi porque es estado real del sistema.",
          controls: {
            allow_write: false,
            requested_actions: false,
            enqueued_actions: [],
            action_policy: "local_capabilities_contract_no_execution",
            upstream_requested_actions: false,
          },
          ...injectedMeta,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  const guardedPayload = {
    ...parsed.data,
    mode: "auto",
    prefer: "auto",
    allow_actions: false,
    context_data: {
      ...(parsed.data.context_data ?? {}),
      hocker_runtime: {
        ...(typeof parsed.data.context_data?.hocker_runtime === "object" ? parsed.data.context_data.hocker_runtime : {}),
        ...upstreamRuntimeContext,
      },
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55_000);

  try {
    const res = await fetch(`${baseUrl}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Hocker-Source": "hocker.one.production-gate",
      },
      body: JSON.stringify(guardedPayload),
      signal: controller.signal,
      cache: "no-store",
    });

    const responseJson = (await res.json().catch(() => ({}))) as NovaChatResponse;
    const safePayload = sanitizeNovaPayload(responseJson, injectedMeta, localActionDraft);

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
        meta: injectedMeta,
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
