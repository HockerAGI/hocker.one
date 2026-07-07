"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  CircleAlert,
  Code2,
  Database,
  FileText,
  ImageIcon,
  Loader2,
  LockKeyhole,
  Mic2,
  PanelRight,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Video,
  XCircle,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

/* ── Extracted types & constants ─────────────────────────────── */
import type {
  ChatActionDraft,
  Msg,
  RuntimeAction,
  QueueLock,
  RuntimeSummary,
  NativeCapability,
  ActionListResponse,
  MutateResponse,
} from "./nova-chat-types";
import {
  BLOCKING_STATUSES,
  NATIVE_CAPABILITIES,
} from "./nova-chat-types";

/* ── Extracted helpers ───────────────────────────────────────── */
import {
  generateId,
  pickContent,
  extractActions,
  extractQueueLock,
  shouldAllowActionDraft,
  isReadyForProduction,
  formatScope,
  buildGuidedGitHubChain,
  statusTone,
  CAPABILITY_GROUPS,
} from "./nova-chat-helpers";

/* ── Extracted sub-components ────────────────────────────────── */
import { DraftCard } from "./DraftCard";
import { GuidedGitHubChainCard } from "./GuidedGitHubChainCard";
import { RuntimeActionCard } from "./RuntimeActionCard";

/* ── Local: capabilityIcon (requires React / lucide icons) ──── */
function capabilityIcon(key: string) {
  if (key === "archivo") return <Paperclip className="h-4 w-4" />;
  if (key === "imagen") return <ImageIcon className="h-4 w-4" />;
  if (key === "video") return <Video className="h-4 w-4" />;
  if (key === "voz") return <Mic2 className="h-4 w-4" />;
  if (key === "avatar") return <Bot className="h-4 w-4" />;
  if (key === "repo") return <Code2 className="h-4 w-4" />;
  if (key === "investigacion") return <Search className="h-4 w-4" />;
  if (key === "datos") return <Database className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

/* ══════════════════════════════════════════════════════════════ */
/*  NOVA Realtime Chat — Main Component                        */
/* ══════════════════════════════════════════════════════════════ */
export default function NovaRealtimeChat() {
  const { projectId } = useWorkspace();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState<RuntimeSummary | null>(null);
  const [actions, setActions] = useState<RuntimeAction[]>([]);
  const [queueLock, setQueueLock] = useState<QueueLock | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [threadId] = useState(generateId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const integrations = useMemo(() => summary?.integrations ?? [], [summary]);
  const configured = integrations.filter((item) => ["configured", "connected"].includes(item.status));
  const partial = integrations.filter((item) => item.status === "partial");
  const blockingActions = useMemo(() => actions.filter((item) => BLOCKING_STATUSES.has(item.status)), [actions]);
  const productionAction = useMemo(() => actions.find(isReadyForProduction) ?? null, [actions]);
  const guidedGitHubChain = useMemo(() => buildGuidedGitHubChain(actions), [actions]);
  const guidedGitHubActionIds = useMemo(() => new Set(guidedGitHubChain?.actions.map((item) => item.id) ?? []), [guidedGitHubChain]);
  const standaloneBlockingActions = useMemo(
    () => blockingActions.filter((item) => !guidedGitHubActionIds.has(item.id)),
    [blockingActions, guidedGitHubActionIds],
  );
  const latestDraft = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const draft = messages[i]?.actions?.[0];
      if (draft) return draft;
    }
    return null;
  }, [messages]);

  const effectiveLock: QueueLock = queueLock ?? {
    locked: blockingActions.length > 0,
    can_start_new_task: blockingActions.length === 0,
    reason: blockingActions.length > 0 ? "Hay una tarea pendiente. NOVA no debe iniciar otra todavía." : "Cola limpia.",
    blocking_count: blockingActions.length,
    total_recent: actions.length,
    active_actions: blockingActions,
    status_counts: {},
    checked_at: "",
  };

  const loadRuntime = useCallback(async () => {
    try {
      const [summaryRes, actionsRes] = await Promise.all([
        fetch(`/api/agi/runtime/summary?project_id=${encodeURIComponent(projectId)}`, { credentials: "include", cache: "no-store" }),
        fetch(`/api/agi/runtime/actions?project_id=${encodeURIComponent(projectId)}&limit=30`, { credentials: "include", cache: "no-store" }),
      ]);

      const summaryData = await summaryRes.json().catch(() => ({}));
      const actionsData = (await actionsRes.json().catch(() => ({}))) as ActionListResponse;

      setSummary(summaryData.summary ?? null);
      if (!actionsRes.ok || actionsData.error) throw new Error(actionsData.error || "No se pudo leer la cola AGI.");
      setActions(actionsData.actions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el runtime.");
    }
  }, [projectId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    queueMicrotask(() => { void loadRuntime(); });
    return () => { abortRef.current?.abort(); };
  }, [loadRuntime]);

  async function send(event?: { preventDefault: () => void }) {
    event?.preventDefault();
    const prompt = input.trim();
    if (!prompt || isSending) return;

    const actionLike = shouldAllowActionDraft(prompt);
    // eslint-disable-next-line react-hooks/purity -- generateId()/Date.now() run only inside the send() event handler, never during render
    const userMsg: Msg = { id: generateId(), role: "user", content: prompt, createdAt: Date.now() };
    const novaId = generateId();

    setMessages((prev) => [...prev, userMsg, { id: novaId, role: "nova", content: "", createdAt: Date.now(), streaming: true }]);
    setInput("");
    setIsSending(true);
    setError(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      if (actionLike) {
        const res = await fetch("/api/nova/chat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            project_id: projectId,
            thread_id: threadId,
            message: prompt,
            mode: "auto",
            allow_actions: false,
            context_data: {
              source: "nova_chat_ux_12_7k_preview",
              expectation: "preview visual seguro, sin encolar ni ejecutar desde chat",
            },
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) throw new Error(String(data?.error || `Hablar con NOVA HTTP ${res.status}`));

        const nextLock = extractQueueLock(data);
        if (nextLock) setQueueLock(nextLock);

        const draftActions = extractActions(data);
        const content = pickContent(data) || "NOVA preparó un preview seguro.";

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === novaId
              ? {
                  ...msg,
                  content,
                  streaming: false,
                  actions: draftActions,
                  meta: data && typeof data === "object" ? (data as Record<string, unknown>).meta as Record<string, unknown> : null,
                }
              : msg,
          ),
        );

        await loadRuntime();
        return;
      }

      const res = await fetch("/api/nova/chat/stream", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          project_id: projectId,
          thread_id: threadId,
          message: prompt,
          mode: "auto",
          allow_actions: false,
          tools_requested: [],
          context_data: {
            source: "nova_chat_ux_12_7k_stream",
            expectation: "respuesta natural, clara, sin ejecutar tareas nuevas desde chat",
          },
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Hablar con NOVA HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let received = false;
      let streamedActions: ChatActionDraft[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const dataLine = raw.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;

          const rawData = dataLine.replace(/^data:\s*/, "");
          if (!rawData || rawData === "[DONE]") continue;

          let parsed: unknown = rawData;
          try { parsed = JSON.parse(rawData); } catch {}

          const nextLock = extractQueueLock(parsed);
          if (nextLock) setQueueLock(nextLock);

          const eventActions = extractActions(parsed);
          if (eventActions.length) streamedActions = eventActions;

          const maybeError = parsed && typeof parsed === "object" ? (parsed as { error?: unknown }).error : null;
          if (typeof maybeError === "string") {
            setError(maybeError);
            continue;
          }

          const piece = pickContent(parsed);
          if (!piece) continue;

          received = true;
          setMessages((prev) => prev.map((msg) => msg.id === novaId ? { ...msg, content: `${msg.content}${piece}`, streaming: true } : msg));
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === novaId
            ? {
                ...msg,
                content: msg.content || (received ? msg.content : "NOVA respondió sin texto visible."),
                streaming: false,
                actions: streamedActions,
              }
            : msg,
        ),
      );

      await loadRuntime();
    } catch (err) {
      const msg = err instanceof Error ? msgFromError(err) : "Fallo en Hablar con NOVA.";
      setError(msg);
      setMessages((prev) => prev.map((item) => item.id === novaId ? { ...item, role: "system", content: msg, streaming: false } : item));
    } finally {
      setIsSending(false);
    }
  }

  function msgFromError(err: Error) {
    if (err.name === "AbortError") return "Solicitud detenida.";
    return err.message || "Fallo en Hablar con NOVA.";
  }

  function stopCurrentRequest() {
    abortRef.current?.abort();
    setIsSending(false);
  }

  function applyCapability(capability: NativeCapability) {
    setInput(capability.prompt);
    setShowCapabilities(false);
  }

  async function mutateAction(action: RuntimeAction, mode: "approve" | "reject" | "execute") {
    setBusyAction(action.id);
    setError(null);

    try {
      const url = mode === "execute" ? "/api/agi/runtime/actions/execute" : "/api/agi/runtime/actions/decision";
      const body =
        mode === "execute"
          ? { project_id: projectId, action_id: action.id }
          : {
              project_id: projectId,
              action_id: action.id,
              decision: mode,
              note: mode === "approve" ? "Aprobado desde NOVA Chat UX." : "Rechazado desde NOVA Chat UX.",
            };

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => ({}))) as MutateResponse;
      if (!res.ok || data.error) throw new Error(data.error || "No se pudo actualizar la acción.");

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "system",
          content:
            data.message ||
            (mode === "execute"
              ? "Acción ejecutada por worker seguro."
              : mode === "approve"
                ? "Acción aprobada por Owner Gate."
                : "Acción descartada."),
          createdAt: Date.now(),
        },
      ]);

      await loadRuntime();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la acción.");
    } finally {
      setBusyAction(null);
    }
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }


  return (
    <div className="flex h-full min-h-[68dvh] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#06152D]/80 shadow-2xl">
      <div className="border-b border-white/10 bg-[#06152D]/90 px-4 py-3 backdrop-blur-xl sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[1.15rem] border border-sky-300/25 bg-sky-300/10 text-sky-100 shadow-[0_0_32px_rgba(30,200,255,0.18)]">
              <Sparkles className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-black text-white">NOVA</h2>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${effectiveLock.locked ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"}`}>
                  {effectiveLock.locked ? "Acciones pendientes" : "Lista"}
                </span>
              </div>
              <p className="truncate text-xs text-slate-400">Chat privado · tu aprobación activa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowSummary((value) => !value)} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10">
              <PanelRight className="mr-1.5 inline h-3.5 w-3.5" />
              Sistema
            </button>
            <button type="button" onClick={() => void loadRuntime()} className="grid min-h-10 min-w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10" aria-label="Actualizar estado">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-300" /> Sin ejecución oculta</span>
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5"><Activity className="mr-1 inline h-3.5 w-3.5 text-sky-300" /> {configured.length}/{integrations.length || summary?.counts?.tools_total || 0} conexiones</span>
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5"><Brain className="mr-1 inline h-3.5 w-3.5 text-amber-300" /> {blockingActions.length} pendientes</span>
        </div>
      </div>

      {showSummary ? (
        <aside className="border-b border-white/10 bg-slate-950/55 px-4 py-3 sm:px-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-white">Sistema</p>
                <span className="text-[11px] text-slate-500">Proyecto privado</span>
              </div>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">AGIs: <b className="text-white">{summary?.counts?.agents ?? "—"}</b></div>
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">Runs: <b className="text-white">{summary?.counts?.runs ?? "—"}</b></div>
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">Pendientes: <b className="text-white">{blockingActions.length}</b></div>
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">Parciales: <b className="text-white">{partial.length}</b></div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="mb-3 text-sm font-black text-white">Conexiones</p>
              <div className="flex flex-wrap gap-2">
                {integrations.slice(0, 10).map((item) => (
                  <span key={item.tool_key} className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusTone(item.status)}`}>
                    {item.name}
                  </span>
                ))}
                {integrations.length === 0 ? <span className="text-xs text-slate-500">Cargando estado real.</span> : null}
              </div>
            </div>
          </div>
        </aside>
      ) : null}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-8 text-center sm:py-12">
            <div className="grid h-16 w-16 place-items-center rounded-[1.4rem] border border-sky-300/25 bg-sky-300/10 text-sky-100 shadow-[0_0_50px_rgba(30,200,255,0.18)]">
              <Bot className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-2xl font-black text-white">Lista para trabajar contigo.</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Pídele algo a NOVA. Si requiere tocar código, datos o integraciones, primero verás un preview claro y la acción esperará tu aprobación.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {NATIVE_CAPABILITIES.slice(0, 6).map((capability) => (
                <button
                  key={capability.key}
                  type="button"
                  onClick={() => applyCapability(capability)}
                  className="min-h-10 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-100 transition hover:border-sky-300/25 hover:bg-sky-300/10"
                >
                  {capability.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[92%] sm:max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`rounded-[1.4rem] border px-4 py-3 shadow-lg ${
                    msg.role === "user"
                      ? "border-sky-300/20 bg-sky-300/12 text-sky-50"
                      : msg.role === "system"
                        ? "border-amber-300/25 bg-amber-300/10 text-amber-50"
                        : "border-white/10 bg-white/[0.055] text-slate-100"
                  }`}>
                    <div className="mb-2 flex items-center gap-2">
                      {msg.role === "user" ? <Zap className="h-3.5 w-3.5 text-sky-200" /> : msg.role === "system" ? <CircleAlert className="h-3.5 w-3.5 text-amber-200" /> : <Sparkles className="h-3.5 w-3.5 text-sky-200" />}
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        {msg.role === "user" ? "Tú" : msg.role === "system" ? "Sistema" : "NOVA"}
                      </span>
                      {msg.streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-200" /> : null}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{msg.content || (msg.streaming ? "Pensando…" : "")}</p>
                  </div>

                  {msg.actions?.map((draft, index) => (
                    <DraftCard key={`${msg.id}-draft-${index}`} draft={draft} onShowSummary={() => setShowSummary(true)} onCancel={() => setMessages((prev) => prev.filter((m) => m.actions?.[0] !== draft))} />
                  ))}
                </div>
              </div>
            ))}

            {productionAction ? (
              <RuntimeActionCard action={productionAction} busyAction={busyAction} onShowSummary={() => setShowSummary(true)} onMutate={mutateAction} />
            ) : null}
          </div>
        )}
      </div>

      {blockingActions.length > 0 ? (
        <div className="border-t border-white/10 bg-slate-950/50 px-4 py-3 sm:px-5">
          <div className="mx-auto max-w-5xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-100">
              <LockKeyhole className="h-4 w-4" />
              Hay tareas esperando tu aprobación. NOVA guía un paso a la vez.
            </div>
            <div className="grid gap-3">
              {guidedGitHubChain ? <GuidedGitHubChainCard chain={guidedGitHubChain} busyAction={busyAction} onShowSummary={() => setShowSummary(true)} onMutate={mutateAction} /> : null}

              {standaloneBlockingActions.slice(0, guidedGitHubChain ? 1 : 2).map((action) => (
                <RuntimeActionCard key={action.id} action={action} busyAction={busyAction} onShowSummary={() => setShowSummary(true)} onMutate={mutateAction} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {latestDraft ? (
        <div className="border-t border-white/10 bg-sky-300/[0.035] px-4 py-2 text-center text-xs text-sky-100">
          Preview seguro: {formatScope(latestDraft.scope)} · sin ejecutar nada.
        </div>
      ) : null}

      {error ? (
        <div className="border-t border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          <XCircle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : null}

      <form onSubmit={(event) => void send(event)} className="border-t border-white/10 bg-[#06152D]/95 p-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-xl sm:p-4">
        {showCapabilities ? (
          <div className="mb-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-black text-white">Herramientas</p>
              <span className="text-[11px] text-slate-500">Se activan cuando aplique</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {CAPABILITY_GROUPS.map((group) => (
                <div key={group.title} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{group.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.keys.map((key) => {
                      const capability = NATIVE_CAPABILITIES.find((item) => item.key === key);
                      if (!capability) return null;
                      return (
                        <button
                          key={capability.key}
                          type="button"
                          onClick={() => applyCapability(capability)}
                          title={capability.detail}
                          className="min-h-10 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-left text-xs font-bold text-slate-200 hover:border-sky-300/25 hover:bg-sky-300/10"
                        >
                          <span className="mr-1.5 inline-flex align-middle text-sky-200">{capabilityIcon(capability.key)}</span>
                          {capability.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mx-auto flex max-w-5xl items-end gap-2 rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
          <button type="button" onClick={() => setShowCapabilities((value) => !value)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" aria-label="Abrir herramientas">
            <Plus className="h-5 w-5" />
          </button>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onComposerKeyDown}
            rows={1}
            placeholder="Pídele algo a NOVA…"
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />

          {isSending ? (
            <button type="button" onClick={stopCurrentRequest} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15" aria-label="Detener">
              <Square className="h-4 w-4" />
            </button>
          ) : null}

          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-300 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.25)] hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Enviar"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>

        <div className="mx-auto mt-2 flex max-w-5xl flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500">
          <span>NOVA entiende lenguaje natural.</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            Sin ejecución oculta · tu aprobación activa
          </span>
        </div>
      </form>
    </div>
  );
}
