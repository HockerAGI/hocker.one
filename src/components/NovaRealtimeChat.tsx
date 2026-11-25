"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, ChevronLeft, CircleAlert, Cpu, Info, Loader2, RotateCw, Send, Sparkles, Square, Plus, Copy, Code2, Activity, ShieldCheck } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import { DraftCard } from "@/components/DraftCard";
import NovaHistoryPanel from "@/components/NovaHistoryPanel";
import NovaMessageContent from "@/components/NovaMessageContent";
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
  if (/SUPABASE_|SERVICE_ROLE|SECRET_KEY|API_KEY|token|stack trace|fetch failed|NOVA_HISTORY_READ_FAILED/i.test(raw)) return "No se pudo consultar el servicio protegido. Revisa la disponibilidad del entorno.";
  if (/NOVA HTTP 404|HTTP 404/i.test(raw)) return "NOVA no está disponible en este momento.";
  if (/NOVA no está configurada/i.test(raw)) return "NOVA no está disponible en este entorno.";
  return raw;
}

function serviceLabel(status: string): string {
  if (status === "online") return "Motor dedicado responde";
  if (status === "offline") return "Motor dedicado sin señal";
  if (status === "configured") return "Pendiente";
  return "Motor dedicado sin verificar";
}

export default function NovaRealtimeChat({ protectedAvailable = false, preview = false, toolbar }: { protectedAvailable?: boolean; preview?: boolean; toolbar?: ReactNode }) {
  const { projectId, ready } = useWorkspace();
  const params = useSearchParams();
  const requestedThreadId = params.get("thread_id");
  return <NovaConversation key={projectId + ":" + (requestedThreadId ?? params.get("new") ?? "new")} projectId={projectId} ready={ready} requestedThreadId={requestedThreadId} protectedAvailable={protectedAvailable} preview={preview} toolbar={toolbar} />;
}

function NovaConversation({ projectId, ready, requestedThreadId, protectedAvailable, preview, toolbar }: { projectId: string; ready: boolean; requestedThreadId: string | null; protectedAvailable: boolean; preview: boolean; toolbar?: ReactNode }) {
  const [threadId] = useState(() => requestedThreadId || generateId());
  const [historyReady, setHistoryReady] = useState(!requestedThreadId);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState<RuntimeSummary | null>(null);
  const [queueLock, setQueueLock] = useState<QueueLock>(protectedAvailable ? EMPTY_LOCK : unreadableQueueLock("Consulta protegida no disponible.", EMPTY_LOCK));
  const [queueSnapshot, setQueueSnapshot] = useState<{ projectId: string; actions: RuntimeAction[]; pending: number; checked: boolean }>({ projectId: "", actions: [], pending: 0, checked: false });
  const queueVerified = queueSnapshot.projectId === projectId && queueSnapshot.checked;
  const liveActions = queueVerified ? queueSnapshot.actions : [];
  const [error, setError] = useState<string | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [stoppable, setStoppable] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const runtimeRequest = useRef(0);
  const novaStatus = summary?.service_status?.nova?.status ?? "unknown";

  const loadRuntime = useCallback(async () => {
    if (!ready) return;
    const request = ++runtimeRequest.current;
    setRefreshing(true);
    try {
      if (!protectedAvailable) {
        const response = await fetch(`/api/agi/runtime/summary?project_id=${encodeURIComponent(projectId)}`, { cache: "no-store" });
        const body = (await response.json().catch(() => ({}))) as SummaryResponse;
        if (request !== runtimeRequest.current) return;
        setSummary(response.ok && body.ok === true ? body.summary ?? null : null);
        setRuntimeError(response.ok && body.ok === true ? null : "No se pudo consultar el estado.");
        return;
      }
      const [summaryResponse, actionsResponse, pendingResponse, approvedResponse] = await Promise.all([
        fetch(`/api/agi/runtime/summary?project_id=${encodeURIComponent(projectId)}`, { cache: "no-store" }),
        fetch(`/api/agi/runtime/actions?project_id=${encodeURIComponent(projectId)}&limit=100`, { cache: "no-store" }),
        fetch(`/api/agi/runtime/actions?project_id=${encodeURIComponent(projectId)}&status=needs_approval&limit=100`, { cache: "no-store" }),
        fetch(`/api/agi/runtime/actions?project_id=${encodeURIComponent(projectId)}&status=approved&limit=100`, { cache: "no-store" }),
      ]);
      const summaryBody = (await summaryResponse.json().catch(() => ({}))) as SummaryResponse;
      const actionsBody = (await actionsResponse.json().catch(() => ({}))) as ActionResponse;
      if (request !== runtimeRequest.current) return;
      let nextError: string | null = null;
      if (summaryResponse.ok && summaryBody.ok === true && summaryBody.summary) setSummary(summaryBody.summary);
      else { setSummary(null); nextError = readableError(summaryBody.error ?? `Estado HTTP ${summaryResponse.status}`); }

      const pendingBody = (await pendingResponse.json().catch(() => ({}))) as ActionResponse;
      const approvedBody = (await approvedResponse.json().catch(() => ({}))) as ActionResponse;
      if (request !== runtimeRequest.current) return;
      if (actionsResponse.ok && actionsBody.ok === true && Array.isArray(actionsBody.actions) &&
          pendingResponse.ok && pendingBody.ok === true && Array.isArray(pendingBody.actions) &&
          approvedResponse.ok && approvedBody.ok === true && Array.isArray(approvedBody.actions)) {
        const actions = [...new Map([...actionsBody.actions, ...pendingBody.actions, ...approvedBody.actions].map(action => [action.id, action])).values()];
        setQueueSnapshot({ projectId, actions, pending: pendingBody.actions.length, checked: true });
        setQueueLock(extractQueueLock(actionsBody) ?? actionsBody.queue_lock ?? buildLocalLock(actions));
      } else {
        setQueueSnapshot({ projectId, actions: [], pending: 0, checked: false });
        const actionError = readableError(pendingBody.error ?? approvedBody.error ?? actionsBody.error ?? "No se pudo comprobar la cola de aprobaciones.");
        setQueueLock((current) => unreadableQueueLock(actionError, current));
        nextError = nextError ? `${nextError} · ${actionError}` : actionError;
      }
      setRuntimeError(nextError);
    } catch (runtimeError) {
      if (request !== runtimeRequest.current) return;
      setSummary(null);
      const message = readableError(runtimeError instanceof Error ? runtimeError.message : runtimeError);
      setQueueSnapshot({ projectId, actions: [], pending: 0, checked: false });
      setQueueLock((current) => unreadableQueueLock(message, current));
      setRuntimeError(message);
    } finally {
      if (request === runtimeRequest.current) setRefreshing(false);
    }
  }, [projectId, ready, protectedAvailable]);

  useEffect(() => {
    void loadRuntime();
    const timer = protectedAvailable ? window.setInterval(() => { if (document.visibilityState === "visible") void loadRuntime(); }, 60_000) : undefined;
    return () => { if (timer !== undefined) window.clearInterval(timer); runtimeRequest.current += 1; };
  }, [loadRuntime, protectedAvailable]);

  useEffect(() => {
    if (!ready || !requestedThreadId || !protectedAvailable) return;
    let active = true;
    void fetch("/api/nova/history?project_id=" + encodeURIComponent(projectId) + "&thread_id=" + encodeURIComponent(requestedThreadId) + "&messages=60", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.ok !== true) throw new Error(readableError(body.error ?? "No se pudo restaurar la conversación."));
        if (!active) return;
        if (!Array.isArray(body.messages)) throw new Error("Historial no disponible.");
        const restored: Msg[] = body.messages.map((item: unknown, index: number) => {
          const value = item as { id?: unknown; role?: unknown; content?: unknown; created_at?: unknown };
          return {
            id: String(value.id ?? requestedThreadId + "-" + index),
            role: value.role === "user" ? "user" : value.role === "assistant" || value.role === "nova" ? "nova" : "system",
            content: typeof value.content === "string" ? value.content : "",
            createdAt: typeof value.created_at === "string" ? Date.parse(value.created_at) : Date.now(),
            streaming: false,
            actions: [],
          };
        }).filter((item: Msg) => item.content.trim());
        setMessages(restored);
        setHistoryReady(true);
        setHistoryError(null);
      })
      .catch((value) => {
        if (active) setHistoryError(value instanceof Error ? value.message : "No se pudo restaurar la conversación.");
      });
    return () => { active = false; };
  }, [projectId, ready, requestedThreadId, protectedAvailable]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const canSend = useMemo(() => Boolean(input.trim()) && !sending && ready && historyReady && protectedAvailable, [input, ready, sending, historyReady, protectedAvailable]);
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
    if (!prompt || sending || !ready || !historyReady || !protectedAvailable || abortRef.current) return;
    const userMessage: Msg = { id: generateId(), role: "user", content: prompt, createdAt: Date.now() };
    const novaMessage: Msg = { id: generateId(), role: "nova", content: "", createdAt: Date.now(), streaming: true };
    setMessages((current) => [...current, userMessage, novaMessage]);
    setInput(""); setError(null); setSending(true);
    const controller = new AbortController(); abortRef.current = controller;
    const actionRequest = shouldAllowActionDraft(prompt);
    setStoppable(!actionRequest);
    try {
      if (actionRequest) await sendSingleResponse(prompt, novaMessage.id, controller.signal);
      else await sendStream(prompt, novaMessage.id, controller.signal);
      await loadRuntime();
    } catch (sendError) {
      const message = controller.signal.aborted ? "Se detuvo la recepción. Consulta Historial antes de repetir: el servidor puede haber registrado la solicitud." : readableError(sendError instanceof Error ? sendError.message : sendError);
      failNovaMessage(novaMessage.id, message); setError(message); await loadRuntime();
    } finally { abortRef.current = null; setSending(false); setStoppable(false); }
  }, [failNovaMessage, input, loadRuntime, sendSingleResponse, sendStream, sending, ready, historyReady, protectedAvailable]);

  const representedIds = new Set(messages.flatMap(message => (message.actions ?? []).map(draft => draft.id).filter(Boolean)));
  const outstanding = liveActions.filter(action => ["needs_approval", "approved"].includes(action.status) && !representedIds.has(action.id));

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (canSend) void send(); }
  };

  return (
    <div className="relative flex h-[100dvh] min-h-[100dvh] w-full flex-col overflow-hidden bg-[#030711]">
      <header className="z-10 border-b border-slate-700/60 bg-[#0b1320]">
        <div className="mx-auto flex min-h-14 w-full max-w-[1100px] flex-wrap items-center gap-1 px-2 py-1 sm:gap-2 sm:px-5">
          <Link href="/owner" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-white/[0.05] hover:text-white" aria-label="Volver a Inicio"><ChevronLeft className="h-5 w-5" /></Link>
          <Sparkles className="h-4 w-4 text-sky-300" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">NOVA</p><p className="text-xs text-slate-300">{preview ? "Preview · conversación protegida" : "Asistente AGI · " + serviceLabel(novaStatus)}</p></div>
          <Link href="/chat/local" className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-sky-300/20 px-2.5 text-xs font-medium text-sky-200 hover:bg-sky-300/10" title="Preflight WebGPU sin créditos ni ejecución"><Cpu className="h-4 w-4" /><span className="hidden sm:inline">Prueba local</span></Link>
          {protectedAvailable ? <><Link href={"/chat?new=" + generateId()} aria-label="Nueva conversación" className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-xs text-slate-200 hover:bg-white/5"><Plus className="h-4 w-4"/><span className="hidden sm:inline">Nueva</span></Link><NovaHistoryPanel /></> : <a href="https://hockerone.vercel.app/chat" className="text-xs font-semibold text-sky-200">Chat e historial en Producción</a>}
           {queueVerified && queueSnapshot.pending > 0 ? <Link href="/owner/actions" className="rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">{queueSnapshot.pending === 100 ? "100+" : queueSnapshot.pending} por aprobar</Link> : null}
          <button type="button" onClick={() => setShowDetail((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white" aria-expanded={showDetail}><Info className="h-4 w-4" />Estado</button>
        </div>
        {showDetail ? (
          <div className="mx-auto grid w-full max-w-[1100px] gap-2 border-t border-white/[0.05] px-4 py-3 text-xs text-slate-400 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
            <div><span className="font-semibold text-slate-200">Estado: {serviceLabel(novaStatus)}</span><span className="ml-3">{summary?.service_status?.nova?.detail ?? "Motor dedicado sin comprobar"}</span>{queueLock.error ? <span className="ml-3 text-rose-300">Aprobaciones sin verificar</span> : null}</div>
            <button type="button" onClick={() => void loadRuntime()} disabled={refreshing} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.07] px-3 text-slate-300 disabled:opacity-50"><RotateCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />Comprobar</button>
          </div>
        ) : null}
      </header>
      {!protectedAvailable ? <div role="status" className="border-b border-sky-300/15 bg-[#101e2d] px-4 py-3 text-sm text-slate-200"><div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-2"><span>{preview ? "Preview: conversación, memoria y acciones protegidas en Producción." : "La memoria protegida no está configurada. No se enviarán mensajes sin persistencia."}</span>{preview ? <a className="font-semibold text-sky-200 underline" href="https://hockerone.vercel.app/chat">Abrir NOVA en Producción</a> : null}</div></div> : null}
      {runtimeError ? <div role="status" className="mx-auto w-full max-w-[960px] px-4 py-2 text-xs text-amber-100">Estado operativo sin verificar. <button type="button" onClick={() => void loadRuntime()} disabled={refreshing} className="underline">Actualizar</button></div> : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5">
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5">
          {outstanding.length > 0 ? (
            <section aria-label="Acciones pendientes del proyecto" className="rounded-2xl border border-slate-700 bg-[#0b1320] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Acciones del proyecto</h2><Link href="/owner/actions" className="text-sm font-medium text-sky-200">Ver todas</Link></div>
              {outstanding.slice().reverse().map(action => <DraftCard projectId={projectId} key={action.id} draft={{ id: action.id, title: action.title, tool_key: action.tool_key, risk_level: action.risk_level }} action={action} queueVerified={queueVerified} refreshing={refreshing} onShowSummary={() => void loadRuntime()} onCancel={() => {}} />)}
            </section>
          ) : null}
          {protectedAvailable && !historyReady ? <p role="status" className="rounded-xl border border-slate-700 p-4 text-sm">{historyError ?? "Cargando conversación…"} {historyError ? <Link href="/chat" className="ml-2 text-sky-200 underline">Nueva conversación</Link> : null}</p> : null}
          {(historyReady || !protectedAvailable) && messages.length === 0 && outstanding.length === 0 ? (
            <div className="mx-auto w-full max-w-[720px] py-8 sm:py-12"><div className="text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] border border-sky-300/30 bg-sky-300/10"><Bot className="h-10 w-10 text-sky-300" /></div><h1 className="mt-5 text-3xl font-semibold text-white">Soy NOVA</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">¿Qué vamos a resolver hoy?</p></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{[{title:"Ingeniería",text:"Analizar código y repositorios",icon:Code2,prompt:"Analiza el estado del repositorio Hocker ONE sin hacer cambios."},{title:"Operación",text:"Consultar estado y conexiones",icon:Activity,prompt:"Consulta el estado operativo y las conexiones verificadas."},{title:"Coordinar AGIs",text:"Revisar capacidades y tareas",icon:Bot,prompt:"Consulta las capacidades de las AGIs y sus límites actuales."}].map(item => <button key={item.title} type="button" disabled={!protectedAvailable} onClick={() => setInput(item.prompt)} className="rounded-2xl border border-slate-700 bg-[#0d1725] p-4 text-left hover:border-sky-300/50 disabled:opacity-50"><item.icon className="mb-2 h-5 w-5 text-sky-300"/><span className="block font-semibold text-white">{item.title}</span><span className="mt-1 block text-sm text-slate-300">{item.text}</span></button>)}<Link href={preview ? "https://hockerone.vercel.app/owner/actions" : "/owner/actions"} className="rounded-2xl border border-slate-700 bg-[#0d1725] p-4 hover:border-sky-300/50"><ShieldCheck className="mb-2 h-5 w-5 text-sky-300"/><span className="block font-semibold text-white">Aprobaciones</span><span className="mt-1 block text-sm text-slate-300">Revisar acciones registradas</span></Link></div></div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "ml-auto w-fit max-w-[88%]" : "mr-auto w-full max-w-[94%]"}>
              <div className={message.role === "user" ? "rounded-[22px] bg-white/[0.08] px-4 py-3 text-base leading-7 text-white" : message.role === "system" ? "rounded-[18px] border border-rose-300/15 bg-rose-300/8 px-4 py-3 text-base leading-7 text-rose-100" : "px-1 py-2 text-base leading-7 text-slate-100"}>
                {message.streaming && !message.content ? <Loader2 className="h-4 w-4 animate-spin text-sky-300" /> : null}
                {message.content ? message.role === "nova" ? <NovaMessageContent content={message.content}/> : <p className="whitespace-pre-wrap break-words">{message.content}</p> : null}
              </div>
              {message.role === "nova" && !message.streaming && message.content ? <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(message.content); setCopyNotice("Respuesta copiada."); } catch { setCopyNotice("No se pudo copiar."); } }} className="mt-1 inline-flex min-h-10 items-center gap-2 px-2 text-xs text-slate-300"><Copy className="h-4 w-4"/>Copiar</button> : null}
              {message.actions?.map((draft, index) => <DraftCard projectId={projectId} key={draft.id || `${message.id}-${index}`} draft={draft} action={liveActions.find(action => action.id === draft.id)} queueVerified={queueVerified} refreshing={refreshing} onShowSummary={() => void loadRuntime()} onCancel={() => setMessages(current => current.map(item => item.id === message.id ? { ...item, actions: item.actions?.filter((_, draftIndex) => draftIndex !== index) } : item))} />)}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {error ? <div className="mx-auto mb-2 flex w-[calc(100%-1.5rem)] max-w-[960px] items-start gap-2 rounded-xl border border-rose-300/15 bg-rose-300/8 px-3 py-2 text-sm text-rose-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div> : null}

      <footer className="shrink-0 border-t border-white/[0.05] bg-[#030711]/94 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl sm:px-5">
        <div role="status" className="sr-only">{copyNotice}</div>
        {toolbar ? <div className="mx-auto mb-2 flex w-full max-w-[960px] flex-wrap items-center gap-2">{toolbar}</div> : null}
        <div className="mx-auto flex w-full max-w-[960px] items-end gap-2 rounded-[22px] border border-white/[0.10] bg-white/[0.04] p-2.5 focus-within:border-sky-300/30">
          <textarea disabled={!protectedAvailable || !historyReady || !ready} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={onKeyDown} rows={1} placeholder={protectedAvailable ? "Escribe a NOVA…" : "Conversación protegida no disponible aquí"} className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base text-white outline-none placeholder:text-slate-400" aria-label="Mensaje para NOVA" />
          {sending && stoppable ? <button type="button" onClick={() => abortRef.current?.abort()} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-600 text-slate-100" aria-label="Detener recepción"><Square className="h-4 w-4"/></button> : null}
          <button type="button" onClick={() => void send()} disabled={!canSend} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-300 text-slate-950 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Enviar">{sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button>
        </div>
        <p className="mx-auto mt-2 max-w-[960px] text-center text-xs text-slate-400">Las acciones sensibles requieren aprobación. Detener la recepción no revierte operaciones del servidor.</p>
      </footer>
    </div>
  );
}
