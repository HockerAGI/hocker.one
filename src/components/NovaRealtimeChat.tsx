"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Bot, CircleAlert, Loader2, Plus, RefreshCw, Send, ShieldCheck, Sparkles } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import { DraftCard } from "@/components/DraftCard";
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
  if (status === "configured") return "Configurada, no verificada";
  return "Verificando";
}

function serviceTone(status: string): string {
  if (status === "online") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (status === "offline") return "border-rose-300/25 bg-rose-300/10 text-rose-100";
  return "border-amber-300/25 bg-amber-300/10 text-amber-100";
}

export default function NovaRealtimeChat() {
  const { projectId, ready } = useWorkspace();
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

      if (summaryResponse.ok && summaryBody.summary) setSummary(summaryBody.summary);
      const actions = Array.isArray(actionsBody.actions) ? actionsBody.actions : [];
      setQueueLock(extractQueueLock(actionsBody) ?? actionsBody.queue_lock ?? buildLocalLock(actions));

      if (!summaryResponse.ok) setError(readableError(summaryBody.error ?? `Estado HTTP ${summaryResponse.status}`));
      else setError(null);
    } catch (runtimeError) {
      setError(readableError(runtimeError instanceof Error ? runtimeError.message : runtimeError));
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
      body: JSON.stringify({ project_id: projectId, message: prompt, allow_actions: false }),
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
        .join("\n");
      if (!payloadText) return;

      const payload = JSON.parse(payloadText) as Record<string, unknown>;
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
  }, [appendNovaText, finishNovaMessage, projectId]);

  const sendSingleResponse = useCallback(async (prompt: string, novaMessageId: string, signal: AbortSignal) => {
    const response = await fetch("/api/nova/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, message: prompt, allow_actions: true }),
      signal,
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as ChatResponse;
    if (!response.ok || body.ok === false || body.error) throw new Error(readableError(body.error ?? `NOVA HTTP ${response.status}`));

    const content = body.reply ?? body.content ?? "";
    if (!content.trim()) throw new Error("NOVA respondió sin contenido. Revisa el runtime antes de reintentar.");
    appendNovaText(novaMessageId, content);
    finishNovaMessage(novaMessageId, body.actions ?? extractActions(body), body.meta ?? null);
  }, [appendNovaText, finishNovaMessage, projectId]);

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

  return (
    <div className="flex min-h-[560px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/45">
      <header className="border-b border-white/10 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
              <Sparkles className="h-5 w-5" />
              <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 ${novaStatus === "online" ? "bg-emerald-400" : novaStatus === "offline" ? "bg-rose-400" : "bg-amber-400"}`} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white">NOVA</h2>
                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] ${serviceTone(novaStatus)}`}>
                  {serviceLabel(novaStatus)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{summary?.service_status?.nova?.detail ?? "Comprobando el runtime..."}</p>
            </div>
          </div>
          <button type="button" onClick={() => void loadRuntime()} disabled={refreshing} className="hko-action-secondary inline-flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Actualizar
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
            {verifiedConnections} verificadas · {configuredConnections} configuradas
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
            {queueLock.blocking_count} pendientes
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-emerald-100">
            <ShieldCheck className="h-3.5 w-3.5" /> Owner Gate
          </span>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 ? (
          <div className="grid min-h-[260px] place-items-center text-center">
            <div>
              <Bot className="mx-auto h-9 w-9 text-cyan-200" />
              <h3 className="mt-3 text-lg font-black text-white">Canal privado con NOVA</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                El estado mostrado arriba proviene de un health check. Las acciones sensibles permanecen bajo aprobación.
              </p>
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[86%]" : "mr-auto max-w-[92%]"}>
            <div className={[
              "rounded-[1.7rem] border px-4 py-3 text-sm leading-7",
              message.role === "user"
                ? "border-cyan-300/20 bg-cyan-300/10 text-white"
                : message.role === "system"
                  ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
                  : "border-white/10 bg-white/[0.055] text-slate-100",
            ].join(" ")}>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                {message.role === "user" ? "Tú" : message.role === "nova" ? "NOVA" : "Sistema"}
              </p>
              {message.streaming && !message.content ? <Loader2 className="h-4 w-4 animate-spin text-cyan-200" /> : null}
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
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100 sm:mx-5">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <footer className="border-t border-white/10 p-4 sm:p-5">
        <div className="flex items-end gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-3 focus-within:border-cyan-300/30">
          <button type="button" disabled title="Adjuntos aún no habilitados" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 text-slate-500">
            <Plus className="h-5 w-5" />
          </button>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={novaStatus === "offline" ? "NOVA está sin señal; puedes reintentar después de actualizar." : "Pídele algo a NOVA..."}
            className="min-h-11 flex-1 resize-none bg-transparent px-1 py-2.5 text-base text-white outline-none placeholder:text-slate-600"
          />
          <button type="button" onClick={() => void send()} disabled={!canSend} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
