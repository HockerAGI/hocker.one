"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  CircleAlert,
  FileText,
  Loader2,
  LockKeyhole,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Undo2,
  XCircle,
  Plus,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

type Msg = { id: string; role: "user" | "nova" | "system"; content: string; createdAt: number; streaming?: boolean };
type Integration = {
  tool_key: string;
  name: string;
  provider: string;
  status: "configured" | "connected" | "partial" | "missing" | "blocked" | "missing_key" | "missing_code";
  supports_read: boolean;
  supports_write: boolean;
  supports_realtime: boolean;
  safe_note?: string;
};
type RuntimeAction = {
  id: string;
  agi_id: string;
  tool_key: string | null;
  action_type: string;
  title: string;
  status: string;
  risk_level: string;
  created_at: string;
  execution_error?: string | null;
  payload?: Record<string, unknown>;
  execution_result?: Record<string, unknown> | null;
};
type QueueLock = {
  locked: boolean;
  can_start_new_task: boolean;
  reason: string;
  blocking_count: number;
  total_recent: number;
  active_actions: RuntimeAction[];
  status_counts: Record<string, number>;
  checked_at: string;
  error?: string;
};
type RuntimeSummary = {
  counts?: { agents: number; tools_configured: number; tools_total: number; actions: number; runs: number };
  integrations?: Integration[];
  schema_ready?: boolean;
  message?: string;
};

type NativeCapability = {
  key: string;
  label: string;
  status: "Activo" | "Protegido" | "Parcial" | "Pendiente";
  detail: string;
  prompt: string;
};

const NATIVE_CAPABILITIES: NativeCapability[] = [
  {
    key: "archivo",
    label: "Archivo",
    status: "Pendiente",
    detail: "PDF, DOC, CSV o ZIP. Falta conectar carga segura real antes de analizar contenido.",
    prompt: "NOVA, quiero importar un archivo. Primero dime qué formato necesitas y cómo lo vas a procesar sin exponer datos sensibles.",
  },
  {
    key: "imagen",
    label: "Imagen",
    status: "Pendiente",
    detail: "Candy Ads será responsable. Falta executor visual real en Hocker ONE.",
    prompt: "NOVA, prepara una solicitud de imagen para Candy Ads. Usa mi branding y dime qué integración falta antes de generar.",
  },
  {
    key: "video",
    label: "Video",
    status: "Pendiente",
    detail: "PRO IA será responsable. HeyGen/Video todavía debe validarse como integración real.",
    prompt: "NOVA, prepara un guion y storyboard de video para PRO IA. Si HeyGen no está conectado, dilo claro.",
  },
  {
    key: "documento",
    label: "Documento",
    status: "Pendiente",
    detail: "Generación exportable pendiente. Puede preparar estructura y contenido desde chat.",
    prompt: "NOVA, prepara un documento ejecutivo y dime qué formato final conviene: PDF, DOCX o canvas interno.",
  },
  {
    key: "presentacion",
    label: "Presentación",
    status: "Pendiente",
    detail: "Decks/presentaciones pendientes de exportador real.",
    prompt: "NOVA, prepara una presentación ejecutiva con estructura de slides y estilo Hocker ONE.",
  },
  {
    key: "repo",
    label: "Repo / código",
    status: "Protegido",
    detail: "GitHub real funciona con branch, PR, pruebas, Owner Gate y auditoría. No toca main directo.",
    prompt: "NOVA, revisa los repos del ecosistema y prepara un plan seguro. No ejecutes nada si hay cola pendiente.",
  },
  {
    key: "investigacion",
    label: "Investigación",
    status: "Parcial",
    detail: "Puede preparar análisis. Deep research con citas queda separado hasta tener pipeline completo.",
    prompt: "NOVA, investiga este tema con fuentes verificables y separa hechos, riesgos y recomendaciones.",
  },
  {
    key: "datos",
    label: "Datos / Supabase",
    status: "Protegido",
    detail: "Solo lectura/estado por ahora. Escritura real debe pasar por Owner Gate.",
    prompt: "NOVA, revisa el estado de datos/Supabase y dime qué puedes leer realmente sin ejecutar cambios.",
  },
];

type ActionListResponse = { ok?: boolean; actions?: RuntimeAction[]; error?: string };
type MutateResponse = { ok?: boolean; message?: string; error?: string };

const BLOCKING_STATUSES = new Set(["needs_approval", "approved", "queued", "dry_run_queued", "running", "executing", "execution_failed", "failed", "error", "needs_fix", "review"]);

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pickContent(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  const item = data as Record<string, unknown>;
  for (const key of ["delta", "content", "reply", "message", "text"]) {
    if (typeof item[key] === "string") return item[key] as string;
  }
  return "";
}

function asQueueLock(value: unknown): QueueLock | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<QueueLock>;
  if (typeof item.locked !== "boolean") return null;
  return {
    locked: item.locked,
    can_start_new_task: Boolean(item.can_start_new_task),
    reason: String(item.reason ?? ""),
    blocking_count: Number(item.blocking_count ?? 0),
    total_recent: Number(item.total_recent ?? 0),
    active_actions: Array.isArray(item.active_actions) ? item.active_actions : [],
    status_counts: item.status_counts && typeof item.status_counts === "object" ? item.status_counts : {},
    checked_at: String(item.checked_at ?? ""),
    error: typeof item.error === "string" ? item.error : undefined,
  };
}

function extractQueueLock(payload: unknown): QueueLock | null {
  if (!payload || typeof payload !== "object") return null;
  const item = payload as Record<string, unknown>;
  const direct = asQueueLock(item.queue_lock);
  if (direct) return direct;

  const meta = item.meta && typeof item.meta === "object" ? (item.meta as Record<string, unknown>) : null;
  const metaLock = meta ? asQueueLock(meta.queue_lock) : null;
  if (metaLock) return metaLock;

  const runtime = meta?.hocker_runtime && typeof meta.hocker_runtime === "object" ? (meta.hocker_runtime as Record<string, unknown>) : null;
  return runtime ? asQueueLock(runtime.queue_lock) : null;
}

function summarizeAction(action: RuntimeAction) {
  const payload = action.payload ?? {};
  const writePlan = typeof payload.write_plan === "object" && payload.write_plan !== null ? payload.write_plan as Record<string, unknown> : {};
  const repo = String(writePlan.repository ?? payload.repository ?? "No definido");
  const branch = String(writePlan.target_branch ?? payload.branch ?? payload.head ?? "No aplica");
  const path = String(writePlan.path ?? payload.path ?? "No aplica");

  return { repo, branch, path };
}

function isReadyForProduction(action: RuntimeAction) {
  const payload = action.payload ?? {};
  const gate = typeof payload.production_gate === "object" && payload.production_gate !== null ? payload.production_gate as Record<string, unknown> : null;
  const validAction = ["github.merge_pr", "production.deploy", "vercel.promote"].includes(action.action_type);
  const ready = gate?.ready === true || action.status === "ready_for_production" || action.status === "production_ready";
  return Boolean(validAction && ready && !action.execution_error);
}

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
  const [threadId] = useState(id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const integrations = useMemo(() => summary?.integrations ?? [], [summary]);
  const configured = integrations.filter((item) => ["configured", "connected"].includes(item.status));
  const blockingActions = useMemo(() => actions.filter((item) => BLOCKING_STATUSES.has(item.status)), [actions]);
  const productionAction = useMemo(() => actions.find(isReadyForProduction) ?? null, [actions]);
  const effectiveLock = queueLock ?? {
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
    void loadRuntime();
    return () => { abortRef.current?.abort(); };
  }, [loadRuntime]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isSending) return;

    const userMsg: Msg = { id: id(), role: "user", content: prompt, createdAt: Date.now() };
    const novaId = id();

    setMessages((prev) => [...prev, userMsg, { id: novaId, role: "nova", content: "", createdAt: Date.now(), streaming: true }]);
    setInput("");
    setIsSending(true);
    setError(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
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
            source: "nova_realtime_chat_production_gate",
            expectation: "respuesta natural, clara, sin tecnicismos innecesarios y sin ejecutar tareas nuevas desde chat",
          },
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Hablar con NOVA HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let received = false;

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

      setMessages((prev) => prev.map((msg) => msg.id === novaId ? { ...msg, content: msg.content || (received ? msg.content : "NOVA respondió sin texto visible."), streaming: false } : msg));
      await loadRuntime();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fallo en Hablar con NOVA.";
      setError(msg);
      setMessages((prev) => prev.map((item) => item.id === novaId ? { ...item, role: "system", content: msg, streaming: false } : item));
    } finally {
      setIsSending(false);
    }
  }

  async function sendToProduction(action: RuntimeAction) {
    setBusyAction(action.id);
    setError(null);

    try {
      if (action.status === "needs_approval" || action.status === "ready_for_production" || action.status === "production_ready") {
        const decision = await fetch("/api/agi/runtime/actions/decision", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            action_id: action.id,
            decision: "approve",
            note: "Autorizado desde NOVA Chat Production Gate.",
          }),
        });
        const decisionData = (await decision.json().catch(() => ({}))) as MutateResponse;
        if (!decision.ok || decisionData.error) throw new Error(decisionData.error || "No se pudo aprobar producción.");
      }

      const execute = await fetch("/api/agi/runtime/actions/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: projectId, action_id: action.id }),
      });
      const executeData = (await execute.json().catch(() => ({}))) as MutateResponse;
      if (!execute.ok || executeData.error) throw new Error(executeData.error || "No se pudo enviar a producción.");

      setMessages((prev) => [...prev, {
        id: id(),
        role: "nova",
        content: "Listo. Autoricé el envío a producción desde el Production Gate y dejé el resultado en auditoría.",
        createdAt: Date.now(),
      }]);
      await loadRuntime();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar a producción.");
    } finally {
      setBusyAction(null);
    }
  }

  async function rejectProduction(action: RuntimeAction) {
    setBusyAction(action.id);
    setError(null);

    try {
      const res = await fetch("/api/agi/runtime/actions/decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          action_id: action.id,
          decision: "reject",
          note: "No enviado desde NOVA Chat Production Gate.",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as MutateResponse;
      if (!res.ok || data.error) throw new Error(data.error || "No se pudo detener producción.");

      setMessages((prev) => [...prev, {
        id: id(),
        role: "nova",
        content: "Perfecto. Detuve el envío a producción. No ejecuté cambios.",
        createdAt: Date.now(),
      }]);
      await loadRuntime();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo detener producción.");
    } finally {
      setBusyAction(null);
    }
  }

  function selectCapability(capability: NativeCapability) {
    setInput(capability.prompt);
    setShowCapabilities(false);
  }

  return (
    <div className="hko-nova-shell">
      <div className="hko-nova-orb hko-nova-orb-a" />
      <div className="hko-nova-orb hko-nova-orb-b" />

      <header className="hko-nova-head">
        <div>
          <p className="hko-nova-kicker"><Activity className="h-4 w-4" /> NOVA · Centro operativo</p>
          <h2>Chat de mando</h2>
          <p>NOVA entiende, elige la AGI correcta y solo pide autorización final cuando todo está probado.</p>
        </div>

        <span className="hko-nova-private"><ShieldCheck className="h-4 w-4" /> privado</span>
      </header>

      <section className="hko-nova-status-grid">
        <article className={`hko-nova-status-card ${effectiveLock.locked ? "is-locked" : "is-clear"}`}>
          <div className="hko-nova-status-icon">{effectiveLock.locked ? <LockKeyhole className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</div>
          <div>
            <span>Cola</span>
            <strong>{effectiveLock.locked ? "Protegida" : "Limpia"}</strong>
            <p>{effectiveLock.reason}</p>
          </div>
        </article>

        <article className="hko-nova-status-card">
          <div className="hko-nova-status-icon"><Brain className="h-5 w-5" /></div>
          <div>
            <span>AGIs</span>
            <strong>{summary?.counts?.agents ?? 16}</strong>
            <p>NOVA las asigna sola según la tarea.</p>
          </div>
        </article>

        <article className="hko-nova-status-card">
          <div className="hko-nova-status-icon"><Sparkles className="h-5 w-5" /></div>
          <div>
            <span>Herramientas</span>
            <strong>{configured.length}/{integrations.length || "—"}</strong>
            <p>Solo se usan si existen llaves y executor real.</p>
          </div>
        </article>
      </section>

      {productionAction ? (
        <section className="hko-production-gate">
          <div>
            <p className="hko-nova-kicker"><Rocket className="h-4 w-4" /> listo para producción</p>
            <h3>{productionAction.title}</h3>
            <p>Este botón solo aparece cuando el cambio ya está marcado como probado, validado y listo.</p>
          </div>

          {showSummary ? (
            <div className="hko-production-summary">
              {Object.entries(summarizeAction(productionAction)).map(([key, value]) => (
                <span key={key}><strong>{key}</strong>{value}</span>
              ))}
            </div>
          ) : null}

          <div className="hko-production-actions">
            <button type="button" onClick={() => setShowSummary((prev) => !prev)}><FileText className="h-4 w-4" /> Ver resumen</button>
            <button type="button" disabled={busyAction === productionAction.id} onClick={() => void sendToProduction(productionAction)}><Rocket className="h-4 w-4" /> Enviar a producción</button>
            <button type="button" disabled={busyAction === productionAction.id || productionAction.status === "approved"} onClick={() => void rejectProduction(productionAction)}><XCircle className="h-4 w-4" /> No enviar</button>
            <button type="button" disabled><Undo2 className="h-4 w-4" /> Deshacer</button>
          </div>
        </section>
      ) : null}

      <main ref={scrollRef} className="custom-scrollbar hko-nova-messages">
        {messages.length === 0 ? (
          <div className="hko-nova-empty">
            <div className="hko-nova-avatar"><Bot className="h-8 w-8" /></div>
            <h3>Habla con NOVA como lo haces aquí.</h3>
            <p>Ejemplo: “NOVA, revisa los 4 repos y dime qué falta para dejar Hocker ONE listo para operar desde el chat.”</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`hko-nova-bubble ${msg.role === "user" ? "is-user" : msg.role === "system" ? "is-system" : "is-nova"}`}>
                  <p className="hko-nova-bubble-label">
                    {msg.role === "nova" ? <Sparkles className="h-3.5 w-3.5" /> : msg.role === "user" ? <Brain className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
                    {msg.role === "user" ? "Tú" : msg.role === "nova" ? "NOVA" : "Sistema"}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}{msg.streaming ? "▌" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {error ? <div className="hko-nova-error"><CircleAlert className="h-4 w-4" /> {error}</div> : null}

      <form onSubmit={send} className="hko-nova-form">

        <div className="hko-nova-input-wrap">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pídele a NOVA que revise, cree, investigue o prepare algo real..."
            rows={1}
            className="custom-scrollbar"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(e as unknown as FormEvent);
              }
            }}
          />
          <button type="submit" disabled={!input.trim() || isSending}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
