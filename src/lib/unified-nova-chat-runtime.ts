import { randomUUID } from "node:crypto";
import { HOCKER_AGI_CANON_VERSION } from "@/lib/hocker-agi-canon";
import {
  buildCanonicalProfilePrompt,
  requireCanonicalAgi,
  routeChatProfile,
} from "@/lib/hocker-agi-operational";
import { buildAgiInferenceContext } from "@/lib/agi-context-builder";
import { completeAgi, configuredAgiRoutes } from "@/lib/agi-model-router";
import {
  buildAgiMcpPromptBlock,
  buildAgiMcpResultBlock,
  collectAgiMcpDeferredActions,
  executeAgiMcpToolCalls,
  parseAgiMcpEnvelope,
  type AgiMcpToolResult,
} from "@/lib/agi-mcp-runtime";
import { appendAgiMessage, ensureAgiSession } from "@/lib/agi-session-store";
import { extractLearningCandidate } from "@/lib/agi-learning-extractor";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { AgiCompletionResult, AgiModelMessage } from "@/lib/agi-model-providers/types";

type JsonRecord = Record<string, unknown>;

type UsageRecord = {
  project_id: string;
  thread_id: string;
  completion: AgiCompletionResult;
  trace_id: string;
  phase: string;
  session_id: string;
};

function db() {
  return createAdminSupabase();
}

function safeText(value: unknown, max = 20_000): string {
  const text = String(value ?? "").replace(/\u0000/g, "").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function recordIntermediateUsage(input: UsageRecord): Promise<void> {
  const { error } = await db().from("llm_usage").insert({
    project_id: input.project_id,
    thread_id: input.thread_id,
    provider: input.completion.provider,
    model: input.completion.model,
    tokens_in: input.completion.usage.tokens_in,
    tokens_out: input.completion.usage.tokens_out,
    meta: {
      trace_id: input.trace_id,
      phase: input.phase,
      agi_session_id: input.session_id,
      route: input.completion.route,
      route_attempts: input.completion.attempts,
      runtime: "hocker-one-unified",
    },
  });
  if (error) throw new Error(`AGI_INTERMEDIATE_USAGE_PERSIST_FAILED: ${error.message}`);
}

function combinedAttempts(...completions: AgiCompletionResult[]): JsonRecord[] {
  return completions.flatMap((completion, completionIndex) =>
    completion.attempts.map((attempt) => ({
      ...attempt,
      completion_index: completionIndex,
    })),
  );
}

function mcpSummary(results: AgiMcpToolResult[]) {
  return {
    parsed: results.length,
    executed: results.filter((item) => item.executed).length,
    deferred: results.filter((item) => item.needs_approval && !item.executed).length,
    failed: results.filter((item) => !item.executed && !item.needs_approval).length,
  };
}

export async function runToolEnabledUnifiedNovaChat(params: {
  project_id: string;
  thread_id?: string | null;
  message: string;
  user_id: string;
  user_email?: string | null;
  context_data?: JsonRecord;
  allow_actions?: boolean;
  oidc_token?: string | null;
}): Promise<JsonRecord> {
  if (!params.user_id) throw new Error("NOVA_CHAT_AUTH_REQUIRED");
  if (!safeText(params.message)) throw new Error("NOVA_CHAT_MESSAGE_REQUIRED");

  const threadId = params.thread_id || randomUUID();
  const traceId = randomUUID();
  const selectedProfileId = routeChatProfile(params.message);
  const specialist = requireCanonicalAgi(selectedProfileId);
  const nova = requireCanonicalAgi("nova");
  const routes = configuredAgiRoutes(params.oidc_token);
  if (!routes.length) throw new Error("AGI_INFERENCE_NOT_CONFIGURED");

  const session = await ensureAgiSession({
    thread_id: threadId,
    project_id: params.project_id,
    user_id: params.user_id,
    agi_id: "nova",
    title: params.message.slice(0, 120),
    channel: "hocker-one",
    surface: "nova-chat",
    sync_legacy_nova: true,
  });

  const userMessage = await appendAgiMessage({
    session_id: session.session_id,
    project_id: params.project_id,
    agi_id: "nova",
    role: "user",
    content: params.message,
    trace_id: traceId,
    meta: {
      user_email: params.user_email ?? null,
      internal_specialist_agi: specialist.id,
      runtime: "hocker-one-unified",
      canon_version: HOCKER_AGI_CANON_VERSION,
    },
    sync_legacy_nova: true,
  });

  const [context, mcpPrompt] = await Promise.all([
    buildAgiInferenceContext({
      agi_id: "nova",
      project_id: params.project_id,
      session_id: session.session_id,
      user_id: params.user_id,
      operational_context: params.context_data ?? {},
    }),
    buildAgiMcpPromptBlock(),
  ]);

  const system = [
    context.system,
    `Identidad pública: NOVA (${nova.id}).`,
    `Perfil especializado interno seleccionado: ${specialist.name} (${specialist.id}).`,
    buildCanonicalProfilePrompt(specialist),
    "La identidad pública siempre es NOVA. El perfil especializado sólo orienta el análisis interno.",
    "No menciones proveedores, modelos, créditos, cuotas, balance, fallback ni infraestructura interna en la respuesta pública.",
    "Las acciones externas nunca se ejecutan desde inferencia; toda mutación requiere Hocker One Owner Gate.",
    mcpPrompt,
  ].filter(Boolean).join("\n\n");

  const baseMessages: AgiModelMessage[] = [
    { role: "system", content: system },
    ...context.messages,
  ];

  const first = await completeAgi({
    messages: baseMessages,
    timeout_ms: 40_000,
    oidc_token: params.oidc_token,
  });
  const envelope = parseAgiMcpEnvelope(first.text);
  const toolResults = envelope.tool_calls.length
    ? await executeAgiMcpToolCalls(envelope.tool_calls, {
        allow_actions: Boolean(params.allow_actions),
      })
    : [];

  const executedReads = toolResults.filter((item) => item.executed);
  let finalCompletion = first;
  let finalReply = safeText(envelope.reply || first.text);

  if (executedReads.length > 0) {
    await recordIntermediateUsage({
      project_id: params.project_id,
      thread_id: threadId,
      completion: first,
      trace_id: traceId,
      phase: "mcp-planning",
      session_id: session.session_id,
    });

    const followUpMessages: AgiModelMessage[] = [
      ...baseMessages,
      { role: "assistant", content: envelope.reply || "Voy a consultar las herramientas disponibles." },
      { role: "user", content: buildAgiMcpResultBlock(toolResults) },
    ];
    finalCompletion = await completeAgi({
      messages: followUpMessages,
      timeout_ms: 40_000,
      oidc_token: params.oidc_token,
    });
    const followUpEnvelope = parseAgiMcpEnvelope(finalCompletion.text);
    finalReply = safeText(followUpEnvelope.reply || finalCompletion.text);
  }

  if (!finalReply) {
    finalReply = toolResults.some((item) => item.needs_approval)
      ? "Preparé la solicitud para revisión mediante Owner Gate. No ejecuté ninguna acción."
      : "No pude generar una respuesta verificable con la evidencia disponible.";
  }

  const deferredActions = collectAgiMcpDeferredActions(toolResults);
  const assistantMessage = await appendAgiMessage({
    session_id: session.session_id,
    project_id: params.project_id,
    agi_id: "nova",
    role: "assistant",
    content: finalReply,
    trace_id: traceId,
    provider: finalCompletion.provider,
    model: finalCompletion.model,
    tokens_in: finalCompletion.usage.tokens_in,
    tokens_out: finalCompletion.usage.tokens_out,
    meta: {
      route: finalCompletion.route,
      route_attempts: combinedAttempts(first, ...(finalCompletion === first ? [] : [finalCompletion])),
      internal_specialist_agi: specialist.id,
      runtime: "hocker-one-unified",
      canon_version: HOCKER_AGI_CANON_VERSION,
      verified_execution: true,
      owner_gate_only: true,
      mcp: mcpSummary(toolResults),
    },
    sync_legacy_nova: true,
  });

  try {
    await extractLearningCandidate({
      project_id: params.project_id,
      session_id: session.session_id,
      assistant_message_id: assistantMessage.id,
      agi_id: "nova",
      user_message: params.message,
      assistant_message: finalReply,
      trace_id: traceId,
    });
  } catch {
    // Learning extraction must never roll back a persisted conversation.
  }

  return {
    ok: true,
    project_id: params.project_id,
    thread_id: threadId,
    session_id: session.session_id,
    reply: finalReply,
    intent: "general",
    agi_id: "nova",
    actions: [],
    trace_id: traceId,
    provider: finalCompletion.provider,
    model: finalCompletion.model,
    meta: {
      runtime: "hocker-one-unified",
      provider_independent: true,
      configured_routes: routes,
      internal_specialist_agi: specialist.id,
      route: finalCompletion.route,
      route_attempts: combinedAttempts(first, ...(finalCompletion === first ? [] : [finalCompletion])),
      context_evidence_refs: context.evidence_refs,
      persisted: {
        user_message_id: userMessage.id,
        assistant_message_id: assistantMessage.id,
      },
      mcp: {
        ...mcpSummary(toolResults),
        deferred_actions: deferredActions,
        tool_names: toolResults.map((item) => item.name),
      },
      controls: {
        allow_write: false,
        requested_actions: Boolean(params.allow_actions),
        enqueued_actions: [],
        action_policy: "owner_gate_only",
      },
    },
  };
}
