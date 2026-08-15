"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Bot, CircleAlert, Loader2, Plus, RefreshCw, Send, ShieldCheck, Sparkles } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import { DraftCard } from "@/components/DraftCard";
import VoiceInput from "@/components/VoiceInput";
import type { ChatActionDraft, Msg, QueueLock, RuntimeAction, RuntimeSummary } from "@/components/nova-chat-types";
import { BLOCKING_STATUSES } from "@/components/nova-chat-types";
import { extractActions, extractQueueLock, generateId, pickContent, shouldAllowActionDraft } from "@/components/nova-chat-helpers";

type SummaryResponse = { ok?: boolean; summary?: RuntimeSummary; error?: string };
type ActionResponse = { ok?: boolean; actions?: RuntimeAction[]; queue_lock?: QueueLock; error?: string };
type ChatResponse = {
  ok?: boolean;
  reply?: string;
  content?: string;
  error?: string;
  actions?: ChatActionDraft[];
  meta?: Record<string, unknown>;
};

const EMPTY_LOCK: QueueLock = {
  locked: false,
  can_start_new_task: true,
  reason: "",
  blocking_count: 0,
  total_recent: 0,
  active_actions: [],
  status_counts: {},
  checked_at: "",
};

function buildLocalLock(actions: RuntimeAction[]): QueueLock {
  const active = actions.filter((action) => BLOCKING_STATUSES.has(action.status));
  const counts = actions.reduce<Record<string, number>>((result, action) => {
    result[action.status] = (result[action.status] ?? 0) + 1;
    return result;
  }, {});

  return {
    locked: active.length > 0,
    can_start_new_task: active.length === 0,
    reason: active.length > 0 ? "Hay acciones pendientes de revisión o ejecución." : "",
    blocking_count: active.length,
    total_recent: actions.length,
    active_actions: active,
    status_counts: counts,
    checked_at: new Date().toISOString(),
  };
}

function unreadableQueueLock(message: string, current: QueueLock): QueueLock {
  return {
    ...current,
    locked: true,
    can_start_new_task: false,
    reason: "No se pudo confirmar que Owner Gate esté libre. Por seguridad, se bloquean tareas nuevas.",
    checked_at: new Date().toISOString(),
    error: message,
  };
}

function readableError(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "No se pudo obtener respuesta de NOVA.";
  if (/NOVA HTTP 404|HTTP 404/i.test(raw)) {
    return "NOVA no está disponible en la URL configurada. Verifica el despliegue y NOVA_AGI_URL.";
  }
  if (/NOVA no está configurada/i.test(raw)) {
    return "NOVA no está configurada en este entorno.";
  }
  return raw;
}

function serviceLabel(status: string): string {
  if (status === "online") return "Conectada";
  if (status === "offline") return "Sin señal";
  if (status === "configured") return "Preparada";
  return "Verificando";
}

function serviceTone(status: string): string {
  if (status === "online") return "border-emerald-300/18 bg-emerald-300/[0.065] text-emerald-200";
  if (status === "offline") return "border-rose-300/18 bg-rose-300/[0.065] text-rose-200";
  return "border-amber-300/18 bg-amber-300/[0.065] text-amber-200";
}

export default function NovaRealtimeChat() {
  const { projectId, ready } = useWorkspace();
  const [threadId] = useState(() => generateId());
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState<RuntimeSummary | null>(null);
  const [queueLock, setQueueLock] = useState<QueueLock>(EMPTY_LOCK);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const novaStatus = summary?.service_status?.nova?.status ?? "unknown";
  const integrations = summary?.integrations ?? [];
  const verifiedConnections = integrations.filter((item) => item.status === "connected" && item.verified !== false).length;
  const configuredConnections = integrations.filter((item) => ["connected", "configured"].includes(item.status)).length;

  const loadRuntime = useCallback(async () => {
    if (!ready) return;
    setRefreshing(true);

    try {
      const [summaryResponse, actionsResponse] = await Promise.all([
        fetch(`/api/agi/runtime/summary?project_id=${encodeURIComponent(projectId)}`, { cache: "no-store" }),
        fetch(`/api/agi/runtime/actions?project_id=${encodeURIComponent(projectId)}`, { cache: "no-store" }),
      ]);

      const summaryBody = (await summaryResponse.json().catch(() => ({}))) as SummaryResponse;
      const actionsBody = (await actionsResponse.json().catch(() => ({}))) as ActionResponse;
      let nextError: string | null = null;

      if (summaryResponse.ok && summaryBody.summary) {
        setSummary(summaryBody.summary);
      } else {
        nextError = readableError(summaryBody.error ?? `Estado HTTP ${summaryResponse.status}`);
      }

      const remoteLock = extractQueueLock(actionsBody) ?? actionsBody.queue_lock ?? null;
      if (actionsResponse.ok && remoteLock) {
        setQueueLock(remoteLock);
      } else if (actionsResponse.ok && Array.isArray(actionsBody.actions)) {
        setQueueLock(buildLocalLock(actionsBody.actions));
      } else {
        const actionError = readableError(actionsBody.error ?? `Owner Gate HTTP ${actionsResponse.status}`);
        setQueueLock((current) => unreadableQueueLock(actionError, current));
        nextError = nextError ? `${nextError} · ${actionError}` : actionError;
      }

      setError(nextError);
    } catch (runtimeError) {
      const message = readableError(runtimeError instanceof Error ? runtimeError.message : runtimeError);
      setQueueLock((current) => unreadableQueueLock(message, current));
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, [projectId, ready]);

  useEffect(() => {
    void loadRuntime();
    const timer = window.setInterval(() => void loadRuntime(), 30_000);
    return () => window.clearInterval(timer);
  }, [loadRuntime]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const canSend = useMemo(() => Boolean(input.trim()) && !sending && ready, [input, ready, sending]);

  const appendNovaText = useCallback((id: string, chunk: string) => {
    if (!chunk) return;
    setMessages((current) => current.map((message) => (
      message.id === id
        ? { ...message, content: `${message.content}${chunk}`, streaming: true }
        : message
    )));
  }, []);

  const finishNovaMessage = useCallback((id: string, actions: ChatActionDraft[], meta: Record<string, unknown> | null) => {
    setMessages((current) => current.map((message) => (
      message.id === id ? { ...message, streaming: false, actions, meta } : message
    )));
  }, []);

  const failNovaMessage = useCallback((id: string, message: string) => {
    setMessages((current) => current.map((item) => (
      item.id === id
        ? { ...item, role: "system", content: message, streaming: false, actions: [] }
        : item
    )));
  }, []);

  const sendStream = useCallback(async (prompt: string, novaMessageId: string, signal: AbortSignal) => {
    const response = await fetch("/api/nova/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ project_id: projectId, thread_id: threadId, message: prompt, allow_actions: false }),
      signal,
      cache: "no-store",
    });

    if (!response.ok || !response.body) {
      const body = (await response.json().catch(() => ({}))) as ChatResponse;
      throw new Error(readableError(body.error ?? `NOVA HTTP ${response.status}`));
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let actions: ChatActionDraft[] = [];
    let meta: Record<string, unknown> | null = null;
    let streamError: string | null = null;

    const processBlock = (block: string) => {
      const lines = block.split(/\r?\n/);
      const eventName = lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ?? "message";
      const payloadText = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n")
        .trim();
      if (!payloadText || payloadText === "[DONE]") return;

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(payloadText) as Record<string, unknown>;
      } catch {
        if (eventName === "message") appendNovaText(novaMessageId, payloadText);
        return;
      }

      const lock = extractQueueLock(payload);
      if (lock) setQueueLock(lock);

      if (eventName === "error" || payload.ok === false) {
        streamError = readableError(payload.error ?? "NOVA no pudo responder.");
        return;
      }

      const content = pickContent(payload);
      if (content) appendNovaText(novaMessageId, content);
      actions = [...actions, ...extractActions(payload)];
      if (payload.meta && typeof payload.meta === "object") meta = payload.meta as Record<string, unknown>;
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        if (block.trim()) processBlock(block);
      }
      if (done) break;
    }
    if (buffer.trim()) processBlock(buffer);
    if (streamError) throw new Error(streamError);

    finishNovaMessage(novaMessageId, actions, meta);
  }, [appendNovaText, finishNovaMessage, projectId, threadId]);

  const sendSingleResponse = useCallback(async (prompt: string, novaMessageId: string, signal: AbortSignal) => {
    const response = await fetch("/api/nova/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, thread_id: threadId, message: prompt, allow_actions: true }),
      signal,
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as ChatResponse;
    if (!response.ok || body.ok === false || body.error) throw new Error(readableError(body.error ?? `NOVA HTTP ${response.status}`));

    const content = body.reply ?? body.content ?? "";
    if (!content.trim()) throw new Error("NOVA respondió sin contenido. Revisa el runtime antes de reintentar.");
    appendNovaText(novaMessageId, content);
    finishNovaMessage(novaMessageId, body.actions ?? extractActions(body), body.meta ?? null);
  }, [appendNovaText, finishNovaMessage, projectId, threadId]);

  const send = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || sending) return;

    const userMessage: Msg = { id: generateId(), role: "user", content: prompt, createdAt: Date.now() };
    const novaMessage: Msg = { id: generateId(), role: "nova", content: "", createdAt: Date.now(), streaming: true };
    setMessages((current) => [...current, userMessage, novaMessage]);
    setInput("");
    setError(null);
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (shouldAllowActionDraft(prompt)) await sendSingleResponse(prompt, novaMessage.id, controller.signal);
      else await sendStream(prompt, novaMessage.id, controller.signal);
      await loadRuntime();
    } catch (sendError) {
      const message = readableError(sendError instanceof Error ? sendError.message : sendError);
      failNovaMessage(novaMessage.id, message);
      setError(message);
      await loadRuntime();
    } finally {
      abortRef.current = null;
      setSending(false);
    }
  }, [failNovaMessage, input, loadRuntime, sendSingleResponse, sendStream, sending]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) void send();
    }
  };

  const addTranscript = useCallback((text: string) => {
    const transcript = text.trim();
    if (!transcript) return;
    setInput((current) => [current.trim(), transcript].filter(Boolean).join(" "));
  }, []);

  return (
    <section className="flex min-h-[calc(100dvh-112px)] flex-col overflow-hidden rounded-[22px] border border-white/[0.065] bg-[#050b16]/78 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <header className="border-b border-white/[0.055] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-sky-300/12 bg-sky-300/[0.055] text-sky-200">
              <Sparkles className="h-4 w-4" />
              <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#050b16] ${novaStatus === "online" ? "bg-emerald-400" : novaStatus === "offline" ? "bg-rose-400" : "bg-amber-300"}`} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[17px] font-black tracking-[-0.025em] text-white">NOVA</h2>
                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${serviceTone(novaStatus)}`}>{serviceLabel(novaStatus)}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-600">{summary?.service_status?.nova?.detail ?? "Comprobando conexión…"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[9px] font-semibold text-slate-500 sm:inline-flex">
              <ShieldCheck className="h-3 w-3 text-emerald-300/70" />
              Aprobaciones {queueLock.error ? "sin verificar" : queueLock.blocking_count}
            </span>
            <span className="hidden rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[9px] font-semibold text-slate-500 md:inline-flex">
              {verifiedConnections}/{configuredConnections || 0} conexiones
            </span>
            <button
              type="button"
              onClick={() => void loadRuntime()}
              disabled={refreshing}
              className="grid h-10 w-10 place-items-center rounded-[12px] border border-white/[0.065] bg-white/[0.02] text-slate-500 transition hover:bg-white/[0.045] hover:text-slate-300 disabled:opacity-50"
              aria-label="Actualizar estado"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-5 sm:px-5 sm:py-6">
        {messages.length === 0 ? (
          <div className="grid min-h-[300px] place-items-center px-4 text-center">
            <div className="max-w-lg">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-[16px] border border-sky-300/12 bg-sky-300/[0.05] text-sky-200">
                <Bot className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-white">¿Qué quieres hacer?</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Pídele a NOVA que analice, cree, prepare cambios o coordine especialistas. Las acciones sensibles aparecerán aquí para tu decisión.
              </p>
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[88%] sm:max-w-[78%]" : "mr-auto max-w-[94%] sm:max-w-[88%]"}>
            <div className={[
              "px-4 py-3 text-sm leading-7",
              message.role === "user"
                ? "rounded-[18px] border border-sky-300/14 bg-sky-300/[0.07] text-white"
                : message.role === "system"
                  ? "rounded-[18px] border border-rose-300/16 bg-rose-300/[0.06] text-rose-100"
                  : "border-l border-sky-300/20 pl-4 text-slate-200",
            ].join(" ")}>
              <p className="mb-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">
                {message.role === "user" ? "Tú" : message.role === "nova" ? "NOVA" : "Sistema"}
              </p>
              {message.streaming && !message.content ? <Loader2 className="h-4 w-4 animate-spin text-sky-200" /> : null}
              {message.content ? <p className="whitespace-pre-wrap">{message.content}</p> : null}
            </div>
            {message.actions?.map((draft, index) => (
              <DraftCard
                key={`${message.id}-${index}`}
                draft={draft}
                onShowSummary={() => void loadRuntime()}
                onCancel={() => setMessages((current) => current.filter((item) => item.id !== message.id))}
              />
            ))}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error ? (
        <div className="mx-3 mb-3 flex items-start gap-2 rounded-[14px] border border-rose-300/16 bg-rose-300/[0.06] px-4 py-3 text-xs leading-5 text-rose-100 sm:mx-5">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <footer className="border-t border-white/[0.055] bg-[#050b16]/88 p-3 sm:p-4">
        <div className="relative flex items-end gap-2 rounded-[18px] border border-white/[0.075] bg-white/[0.025] p-2.5 transition focus-within:border-sky-300/22 focus-within:bg-white/[0.035]">
          <button type="button" disabled title="Adjuntos aún no habilitados" className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-white/[0.065] text-slate-700" aria-label="Adjuntos aún no habilitados">
            <Plus className="h-4 w-4" />
          </button>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={novaStatus === "offline" ? "NOVA está sin señal; actualiza el estado para reintentar." : "Pídele algo a NOVA…"}
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-1 py-2.5 text-base leading-6 text-white outline-none placeholder:text-slate-700"
          />
          <VoiceInput disabled={sending || !ready} onTranscript={addTranscript} />
          <button type="button" onClick={() => void send()} disabled={!canSend} className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-sky-300 text-[#031018] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Enviar a NOVA">
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </footer>
    </section>
  );
}
