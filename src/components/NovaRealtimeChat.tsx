"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Bot, ChevronLeft, CircleAlert, Info, Loader2, RotateCw, Send, Sparkles } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import { DraftCard } from "@/components/DraftCard";
import type { ChatActionDraft, Msg, QueueLock, RuntimeAction, RuntimeSummary } from "@/components/nova-chat-types";
import { BLOCKING_STATUSES } from "@/components/nova-chat-types";
import { extractActions, extractQueueLock, generateId, pickContent, shouldAllowActionDraft } from "@/components/nova-chat-helpers";

type SummaryResponse = { ok?: boolean; summary?: RuntimeSummary; error?: string };
type ActionResponse = { ok?: boolean; actions?: RuntimeAction[]; queue_lock?: QueueLock; error?: string };
type ChatResponse = { ok?: boolean; reply?: string; content?: string; error?: string; actions?: ChatActionDraft[]; meta?: Record<string, unknown> };

const EMPTY_LOCK: QueueLock = {
  locked: false, can_start_new_task: true, reason: "", blocking_count: 0, total_recent: 0,
  active_actions: [], status_counts: {}, checked_at: "",
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
    reason: active.length ? "Hay acciones pendientes de aprobación o ejecución." : "",
    blocking_count: active.length,
    total_recent: actions.length,
    active_actions: active,
    status_counts: counts,
    checked_at: new Date().toISOString(),
  };
}

function unreadableQueueLock(message: string, current: QueueLock): QueueLock {
  return { ...current, locked: true, can_start_new_task: false, reason: "No se pudo confirmar el estado de las aprobaciones. Se bloquean tareas nuevas por seguridad.", checked_at: new Date().toISOString(), error: message };
}

function readableError(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "NOVA no pudo responder.";
  if (/NOVA HTTP 404|HTTP 404/i.test(raw)) return "NOVA no está disponible en este momento.";
  if (/NOVA no está configurada/i.test(raw)) return "NOVA no está disponible en este entorno.";
  return raw;
}

function serviceLabel(status: string): string {
  if (status === "online") return "Listo";
  if (status === "offline") return "Sin conexión";
  if (status === "configured") return "Pendiente";
  return "Comprobando";
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
  const [showDetail, setShowDetail] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const novaStatus = summary?.service_status?.nova?.status ?? "unknown";

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
      if (summaryResponse.ok && summaryBody.summary) setSummary(summaryBody.summary);
      else nextError = readableError(summaryBody.error ?? `Estado HTTP ${summaryResponse.status}`);

      const remoteLock = extractQueueLock(actionsBody) ?? actionsBody.queue_lock ?? null;
      if (actionsResponse.ok && remoteLock) setQueueLock(remoteLock);
      else if (actionsResponse.ok && Array.isArray(actionsBody.actions)) setQueueLock(buildLocalLock(actionsBody.actions));
      else {
        const actionError = readableError(actionsBody.error ?? `Aprobaciones HTTP ${actionsResponse.status}`);
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
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const canSend = useMemo(() => Boolean(input.trim()) && !sending && ready, [input, ready, sending]);
  const appendNovaText = useCallback((id: string, chunk: string) => {
    if (!chunk) return;
    setMessages((current) => current.map((message) => message.id === id ? { ...message, content: `${message.content}${chunk}`, streaming: true } : message));
  }, []);
  const finishNovaMessage = useCallback((id: string, actions: ChatActionDraft[], meta: Record<string, unknown> | null) => {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, streaming: false, actions, meta } : message));
  }, []);
  const failNovaMessage = useCallback((id: string, message: string) => {
    setMessages((current) => current.map((item) => item.id === id ? { ...item, role: "system", content: message, streaming: false, actions: [] } : item));
  }, []);

  const sendStream = useCallback(async (prompt: string, novaMessageId: string, signal: AbortSignal) => {
    const response = await fetch("/api/nova/chat/stream", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ project_id: projectId, thread_id: threadId, message: prompt, allow_actions: false }), signal, cache: "no-store",
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
      const payloadText = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n").trim();
      if (!payloadText || payloadText === "[DONE]") return;
      let payload: Record<string, unknown>;
      try { payload = JSON.parse(payloadText) as Record<string, unknown>; }
      catch { if (eventName === "message") appendNovaText(novaMessageId, payloadText); return; }
      const lock = extractQueueLock(payload);
      if (lock) setQueueLock(lock);
      if (eventName === "error" || payload.ok === false) { streamError = readableError(payload.error ?? "NOVA no pudo responder."); return; }
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
      for (const block of blocks) if (block.trim()) processBlock(block);
      if (done) break;
    }
    if (buffer.trim()) processBlock(buffer);
    if (streamError) throw new Error(streamError);
    finishNovaMessage(novaMessageId, actions, meta);
  }, [appendNovaText, finishNovaMessage, projectId, threadId]);

  const sendSingleResponse = useCallback(async (prompt: string, novaMessageId: string, signal: AbortSignal) => {
    const response = await fetch("/api/nova/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, thread_id: threadId, message: prompt, allow_actions: true }), signal, cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as ChatResponse;
    if (!response.ok || body.ok === false || body.error) throw new Error(readableError(body.error ?? `NOVA HTTP ${response.status}`));
    const content = body.reply ?? body.content ?? "";
    if (!content.trim()) throw new Error("NOVA respondió sin contenido.");
    appendNovaText(novaMessageId, content);
    finishNovaMessage(novaMessageId, body.actions ?? extractActions(body), body.meta ?? null);
  }, [appendNovaText, finishNovaMessage, projectId, threadId]);

  const send = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || sending) return;
    const userMessage: Msg = { id: generateId(), role: "user", content: prompt, createdAt: Date.now() };
    const novaMessage: Msg = { id: generateId(), role: "nova", content: "", createdAt: Date.now(), streaming: true };
    setMessages((current) => [...current, userMessage, novaMessage]);
    setInput(""); setError(null); setSending(true);
    const controller = new AbortController(); abortRef.current = controller;
    try {
      if (shouldAllowActionDraft(prompt)) await sendSingleResponse(prompt, novaMessage.id, controller.signal);
      else await sendStream(prompt, novaMessage.id, controller.signal);
      await loadRuntime();
    } catch (sendError) {
      const message = readableError(sendError instanceof Error ? sendError.message : sendError);
      failNovaMessage(novaMessage.id, message); setError(message); await loadRuntime();
    } finally { abortRef.current = null; setSending(false); }
  }, [failNovaMessage, input, loadRuntime, sendSingleResponse, sendStream, sending]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (canSend) void send(); }
  };

  return (
    <div className="relative flex h-[100dvh] min-h-[100dvh] w-full flex-col overflow-hidden bg-[#030711]">
      <header className="z-10 border-b border-white/[0.06] bg-[#030711]/88 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 w-full max-w-[1100px] items-center gap-2 px-3 sm:px-5">
          <Link href="/owner" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-white/[0.05] hover:text-white" aria-label="Volver a Inicio"><ChevronLeft className="h-5 w-5" /></Link>
          <Sparkles className="h-4 w-4 text-sky-300" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">NOVA</p><p className="text-xs text-slate-500">{serviceLabel(novaStatus)}</p></div>
          {queueLock.blocking_count > 0 ? <Link href="/owner/actions" className="rounded-full bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">{queueLock.blocking_count} por aprobar</Link> : null}
          <button type="button" onClick={() => setShowDetail((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white" aria-expanded={showDetail}><Info className="h-4 w-4" />Detalle</button>
        </div>
        {showDetail ? (
          <div className="mx-auto grid w-full max-w-[1100px] gap-2 border-t border-white/[0.05] px-4 py-3 text-xs text-slate-400 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
            <div><span className="font-semibold text-slate-200">Estado: {serviceLabel(novaStatus)}</span><span className="ml-3">{summary?.service_status?.nova?.detail ?? "Comprobando conexión"}</span>{queueLock.error ? <span className="ml-3 text-rose-300">Aprobaciones sin verificar</span> : null}</div>
            <button type="button" onClick={() => void loadRuntime()} disabled={refreshing} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.07] px-3 text-slate-300 disabled:opacity-50"><RotateCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />Comprobar</button>
          </div>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5">
        <div className="mx-auto flex w-full max-w-[860px] flex-col gap-5">
          {messages.length === 0 ? (
            <div className="grid min-h-[52dvh] place-items-center text-center"><div><Bot className="mx-auto h-9 w-9 text-sky-300" /><h1 className="mt-4 text-2xl font-semibold text-white">¿Qué necesitas?</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">NOVA puede analizar, coordinar y preparar acciones. Lo sensible seguirá pidiendo tu aprobación.</p></div></div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "ml-auto w-fit max-w-[88%]" : "mr-auto w-full max-w-[94%]"}>
              <div className={message.role === "user" ? "rounded-[22px] bg-white/[0.08] px-4 py-3 text-sm leading-7 text-white" : message.role === "system" ? "rounded-[18px] border border-rose-300/15 bg-rose-300/8 px-4 py-3 text-sm leading-7 text-rose-100" : "px-1 py-2 text-sm leading-7 text-slate-100"}>
                {message.streaming && !message.content ? <Loader2 className="h-4 w-4 animate-spin text-sky-300" /> : null}
                {message.content ? <p className="whitespace-pre-wrap">{message.content}</p> : null}
              </div>
              {message.actions?.map((draft, index) => <DraftCard key={`${message.id}-${index}`} draft={draft} onShowSummary={() => void loadRuntime()} onCancel={() => setMessages((current) => current.filter((item) => item.id !== message.id))} />)}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {error ? <div className="mx-auto mb-2 flex w-[calc(100%-1.5rem)] max-w-[860px] items-start gap-2 rounded-xl border border-rose-300/15 bg-rose-300/8 px-3 py-2 text-sm text-rose-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div> : null}

      <footer className="border-t border-white/[0.05] bg-[#030711]/94 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl sm:px-5">
        <div className="mx-auto flex w-full max-w-[860px] items-end gap-2 rounded-[22px] border border-white/[0.10] bg-white/[0.04] p-2.5 focus-within:border-sky-300/30">
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={onKeyDown} rows={1} placeholder={novaStatus === "offline" ? "NOVA está sin conexión" : "Escribe a NOVA…"} className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base text-white outline-none placeholder:text-slate-600" aria-label="Mensaje para NOVA" />
          <button type="button" onClick={() => void send()} disabled={!canSend} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-300 text-slate-950 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Enviar">{sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button>
        </div>
      </footer>
    </div>
  );
}
