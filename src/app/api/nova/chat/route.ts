import { NextResponse } from "next/server";
import { z } from "zod";
import { buildNovaProductionGateContext, getAgiQueueLock } from "@/lib/agi-queue-lock";
import { requireProjectRole, toApiError } from "@/app/api/_lib";
import { buildNovaChatActionDraftPreview } from "@/lib/nova-chat-action-drafts";
import { materializeNovaGitHubActionsFromChat } from "@/lib/nova-github-action-materializer";
import { materializeNovaMcpActionsFromUpstream } from "@/lib/nova-mcp-action-materializer";
import {
  buildNovaCapabilitiesReply,
  buildNovaChatCapabilitiesContext,
  buildNovaUpstreamRuntimeContext,
  shouldAnswerCapabilitiesLocally,
} from "@/lib/hocker-tool-router";
import { log } from "@/lib/logger";
import { sanitizePublicError } from "@/lib/sanitize-error";
import { runServerlessNovaChat } from "@/lib/serverless-agi-runtime";

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

function sanitizeNovaPayload(
  payload: NovaChatResponse,
  injectedMeta: Record<string, unknown>,
  localActionDraft: Record<string, unknown> | null = null,
): Record<string, unknown> {
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
        action_policy: localActionDraft
          ? "nova_chat_action_draft_12_7j_no_execution"
          : "production_gate_12_7c_1_chat_does_not_enqueue_actions",
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
  const jsonBody: unknown = await req.json().catch(() => ({}));
  const parsed = ChatSchema.safeParse(jsonBody);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Payload inválido para NOVA.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let chatCtx: Awaited<ReturnType<typeof requireProjectRole>>;
  try {
    chatCtx = await requireProjectRole(parsed.data.project_id, ["owner", "admin", "operator", "viewer"]);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.payload, { status: apiError.status });
  }

  const queueLock = await getAgiQueueLock(chatCtx.project_id);
  const productionGateContext = buildNovaProductionGateContext(queueLock);
  const capabilitiesContract = buildNovaChatCapabilitiesContext(parsed.data.message, chatCtx.project_id);
  const injectedMeta = { ...productionGateContext, capabilities_contract: capabilitiesContract };
  const upstreamRuntimeContext = buildNovaUpstreamRuntimeContext(
    capabilitiesContract,
    productionGateContext,
  );

  let localActionDraft: Record<string, unknown> | null = null;
  let upstreamActionActorId: string | null = null;
  const draftPreview = buildNovaChatActionDraftPreview({
    project_id: chatCtx.project_id,
    message: parsed.data.message,
    queue_lock: queueLock,
  });

  if (draftPreview && parsed.data.allow_actions) {
    try {
      const actionCtx = await requireProjectRole(chatCtx.project_id, ["owner", "admin", "operator"]);
      upstreamActionActorId = actionCtx.user.id;
      localActionDraft = await materializeNovaGitHubActionsFromChat({
        project_id: actionCtx.project_id,
        message: parsed.data.message,
        queue_lock: queueLock,
        created_by: actionCtx.user.id,
      }) as Record<string, unknown> | null;
    } catch (error) {
      const apiError = toApiError(error);
      return NextResponse.json(apiError.payload, { status: apiError.status });
    }
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
      project_id: chatCtx.project_id,
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
        project_id: chatCtx.project_id,
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

  if (parsed.data.allow_actions && !upstreamActionActorId) {
    try {
      const actionCtx = await requireProjectRole(chatCtx.project_id, ["owner", "admin", "operator"]);
      upstreamActionActorId = actionCtx.user.id;
    } catch (error) {
      const apiError = toApiError(error);
      return NextResponse.json(apiError.payload, { status: apiError.status });
    }
  }

  const guardedPayload = {
    ...parsed.data,
    project_id: chatCtx.project_id,
    user_id: chatCtx.user.id,
    user_email: chatCtx.user.email ?? null,
    mode: "auto",
    prefer: "auto",
    allow_actions: Boolean(upstreamActionActorId),
    context_data: {
      ...(parsed.data.context_data ?? {}),
      hocker_runtime: {
        ...(typeof parsed.data.context_data?.hocker_runtime === "object"
          ? parsed.data.context_data.hocker_runtime
          : {}),
        ...upstreamRuntimeContext,
      },
    },
  };

  const serverlessFallback = async (reason: string): Promise<Response> => {
    const local = await runServerlessNovaChat({
      project_id: chatCtx.project_id,
      thread_id: parsed.data.thread_id ?? null,
      message: parsed.data.message,
      user_id: chatCtx.user.id,
      user_email: chatCtx.user.email ?? null,
      context_data: guardedPayload.context_data,
    });

    const safe = sanitizeNovaPayload(
      local as unknown as NovaChatResponse,
      {
        ...injectedMeta,
        runtime_fallback: {
          active: true,
          reason,
          runtime: "hocker-one-serverless",
          upstream_called: Boolean(baseUrl && key),
        },
      },
      null,
    );

    return NextResponse.json(safe, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  };

  if (!baseUrl || !key) {
    try {
      return await serverlessFallback("NOVA_UPSTREAM_NOT_CONFIGURED");
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: sanitizePublicError(error), meta: injectedMeta },
        { status: 503 },
      );
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

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
    if (!res.ok || responseJson.ok !== true) {
      try {
        return await serverlessFallback(`NOVA_UPSTREAM_HTTP_${res.status}`);
      } catch (fallbackError) {
        return NextResponse.json(
          {
            ok: false,
            error: sanitizePublicError(fallbackError),
            meta: {
              ...injectedMeta,
              upstream_error: `http_${res.status}`,
              fallback_error: true,
            },
          },
          { status: 502 },
        );
      }
    }

    let mcpBridge: Awaited<ReturnType<typeof materializeNovaMcpActionsFromUpstream>> = {
      actions: [],
      rejected: [],
    };

    const upstreamMcp =
      responseJson.meta &&
      typeof responseJson.meta.mcp === "object" &&
      responseJson.meta.mcp !== null &&
      !Array.isArray(responseJson.meta.mcp)
        ? (responseJson.meta.mcp as Record<string, unknown>)
        : {};
    const hasDeferredMcpActions =
      Array.isArray(upstreamMcp.deferred_actions) && upstreamMcp.deferred_actions.length > 0;

    if (upstreamActionActorId && hasDeferredMcpActions) {
      try {
        mcpBridge = await materializeNovaMcpActionsFromUpstream({
          project_id: chatCtx.project_id,
          created_by: upstreamActionActorId,
          original_message: parsed.data.message,
          trace_id: responseJson.trace_id ?? null,
          upstream_meta: responseJson.meta,
        });
      } catch (error) {
        mcpBridge = {
          actions: [],
          rejected: [{ reason: sanitizePublicError(error) }],
        };
      }
    }

    const safePayload = sanitizeNovaPayload(responseJson, injectedMeta, localActionDraft);
    const currentActions = Array.isArray(safePayload.actions) ? safePayload.actions : [];
    safePayload.actions = [...currentActions, ...mcpBridge.actions];

    const safeMeta =
      safePayload.meta &&
      typeof safePayload.meta === "object" &&
      !Array.isArray(safePayload.meta)
        ? (safePayload.meta as Record<string, unknown>)
        : {};
    const safeControls =
      safeMeta.controls &&
      typeof safeMeta.controls === "object" &&
      !Array.isArray(safeMeta.controls)
        ? (safeMeta.controls as Record<string, unknown>)
        : {};

    safeControls.requested_actions = parsed.data.allow_actions;
    safeControls.enqueued_actions = safePayload.actions;
    safeControls.upstream_requested_actions = Boolean(upstreamActionActorId);
    if (mcpBridge.actions.length > 0) {
      safeControls.action_policy = "nova_mcp_actions_waiting_owner_gate";
    }

    safeMeta.controls = safeControls;
    safeMeta.mcp_owner_gate = {
      requested: parsed.data.allow_actions,
      drafts_received: hasDeferredMcpActions,
      materialized: mcpBridge.actions.length,
      rejected: mcpBridge.rejected,
    };
    safePayload.meta = safeMeta;

    return NextResponse.json(safePayload, {
      status: res.status,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    log.error("NOVA chat upstream failure", {
      route: "/api/nova/chat",
      timeout: isTimeout,
    });

    try {
      return await serverlessFallback(
        isTimeout ? "NOVA_UPSTREAM_TIMEOUT" : "NOVA_UPSTREAM_UNAVAILABLE",
      );
    } catch (fallbackError) {
      return NextResponse.json(
        {
          ok: false,
          error: sanitizePublicError(fallbackError),
          meta: {
            ...injectedMeta,
            upstream_error: isTimeout ? "timeout" : "unavailable",
            fallback_error: true,
          },
        },
        { status: 502 },
      );
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
