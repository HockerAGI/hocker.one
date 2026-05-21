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
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Undo2,
  Video,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

type ChatActionDraft = {
  version?: string;
  requested?: boolean;
  enqueued?: boolean;
  executed?: boolean;
  project_id?: string;
  scope?: string;
  tool_key?: string | null;
  owner_agi?: string;
  risk_level?: string;
  can_enqueue?: boolean;
  reason?: string;
  current_limit?: string;
  next_step?: string;
  draft?: {
    title?: string;
    original_message?: string;
    action_policy?: string;
    execution_ready?: boolean;
    owner_gate_required?: boolean;
    queue_lock_checked?: boolean;
    proposed_flow?: string[];
  };
  public_context?: Record<string, unknown>;
};

type Msg = {
  id: string;
  role: "user" | "nova" | "system";
  content: string;
  createdAt: number;
  streaming?: boolean;
  actions?: ChatActionDraft[];
  meta?: Record<string, unknown> | null;
};

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

type ActionListResponse = { ok?: boolean; actions?: RuntimeAction[]; error?: string };
type MutateResponse = { ok?: boolean; message?: string; error?: string };

const BLOCKING_STATUSES = new Set([
  "needs_approval",
  "approved",
  "queued",
  "dry_run_queued",
  "running",
  "executing",
  "execution_failed",
  "failed",
  "error",
  "needs_fix",
  "review",
]);

const NATIVE_CAPABILITIES: NativeCapability[] = [
  {
    key: "archivo",
    label: "Archivos",
    status: "Pendiente",
    detail: "PDF, DOC, CSV, ZIP e importación segura. Falta subir archivos desde Hocker ONE.",
    prompt: "NOVA, quiero importar un archivo. Dime cómo lo vas a procesar sin exponer datos sensibles.",
  },
  {
    key: "imagen",
    label: "Imagen",
    status: "Pendiente",
    detail: "Candy Ads será responsable. Falta executor visual real conectado a Hocker ONE.",
    prompt: "NOVA, prepara una solicitud de imagen para Candy Ads con branding Hocker.",
  },
  {
    key: "video",
    label: "Video",
    status: "Pendiente",
    detail: "PRO IA será responsable. HeyGen/video requiere integración validada.",
    prompt: "NOVA, prepara un guion y storyboard de video para PRO IA.",
  },
  {
    key: "voz",
    label: "Voz",
    status: "Pendiente",
    detail: "Texto a voz y clonación de voz requieren integración real y permisos.",
    prompt: "NOVA, prepara un flujo de voz para el ecosistema y dime qué falta conectar.",
  },
  {
    key: "avatar",
    label: "Avatar",
    status: "Pendiente",
    detail: "Avatar y humanoide NOVA requieren pipeline visual/video validado.",
    prompt: "NOVA, prepara el flujo para avatar de NOVA sin fingir generación.",
  },
  {
    key: "documento",
    label: "Documentos",
    status: "Pendiente",
    detail: "Puede estructurar contenido. Exportación PDF/DOCX queda como siguiente módulo.",
    prompt: "NOVA, prepara un documento ejecutivo listo para exportar.",
  },
  {
    key: "presentacion",
    label: "Slides",
    status: "Pendiente",
    detail: "Presentaciones exportables quedan pendientes de generador real.",
    prompt: "NOVA, prepara una presentación ejecutiva estilo Hocker ONE.",
  },
  {
    key: "repo",
    label: "Código",
    status: "Protegido",
    detail: "GitHub real protegido. Branch/PR/Owner Gate. Nunca main directo.",
    prompt: "NOVA, revisa el repo y prepara una mejora sin ejecutar nada.",
  },
  {
    key: "investigacion",
    label: "Research",
    status: "Parcial",
    detail: "Puede preparar análisis. Investigación profunda con citas entra en módulo dedicado.",
    prompt: "NOVA, investiga este tema con fuentes verificables y separa hechos de recomendaciones.",
  },
  {
    key: "datos",
    label: "Datos",
    status: "Protegido",
    detail: "Supabase lectura/estado. Escritura solo con Owner Gate.",
    prompt: "NOVA, revisa el estado de Supabase sin cambiar datos.",
  },
];

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function compact(value: unknown, max = 220): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
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

function extractActions(data: unknown): ChatActionDraft[] {
  if (!data || typeof data !== "object") return [];
  const item = data as Record<string, unknown>;
  if (Array.isArray(item.actions)) return item.actions.filter((entry) => entry && typeof entry === "object") as ChatActionDraft[];

  const meta = item.meta && typeof item.meta === "object" ? (item.meta as Record<string, unknown>) : null;
  const draft = meta?.chat_action_draft;
  if (draft && typeof draft === "object" && !Array.isArray(draft)) return [draft as ChatActionDraft];

  return [];
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

function shouldAllowActionDraft(prompt: string) {
  return /haz|hacer|crea|crear|prepara|preparar|corrige|corregir|modifica|modificar|actualiza|actualizar|implementa|implementar|ejecuta|ejecutar|revisa|revisar|conecta|conectar|despliega|desplegar|genera|generar|github|repo|repositorio|c[oó]digo|branch|rama|pull request|\bpr\b|commit|supabase|vercel|terminal|meta ads|campaña|anuncio|zip|archivo|imagen|video|voz|avatar/i.test(prompt);
}

function isReadyForProduction(action: RuntimeAction) {
  const payload = action.payload ?? {};
  const gate = typeof payload.production_gate === "object" && payload.production_gate !== null ? payload.production_gate as Record<string, unknown> : null;
  const validAction = ["github.merge_pr", "production.deploy", "vercel.promote"].includes(action.action_type);
  const ready = gate?.ready === true || action.status === "ready_for_production" || action.status === "production_ready";
  return Boolean(validAction && ready && !action.execution_error);
}

function summarizeAction(action: RuntimeAction) {
  const payload = action.payload ?? {};
  const writePlan = typeof payload.write_plan === "object" && payload.write_plan !== null ? payload.write_plan as Record<string, unknown> : {};
  const repo = String(writePlan.repository ?? payload.repository ?? "No definido");
  const branch = String(writePlan.target_branch ?? payload.branch ?? payload.head ?? "No aplica");
  const path = String(writePlan.path ?? payload.path ?? "No aplica");
  return { repo, branch, path };
}

function statusTone(status: string) {
  if (["connected", "configured", "active", "executed", "completed", "approved"].includes(status)) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (["partial", "needs_approval", "ready_for_production", "production_ready", "queued", "review"].includes(status)) return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  if (["blocked", "failed", "error", "execution_failed", "missing", "missing_key", "missing_code", "rejected"].includes(status)) return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  return "border-slate-400/20 bg-white/5 text-slate-200";
}

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

function formatScope(scope?: string) {
  const map: Record<string, string> = {
    github_code: "Código / GitHub",
    supabase_data: "Datos / Supabase",
    vercel_cloud: "Vercel / Cloud",
    terminal_local: "Terminal / Entorno",
    ads_marketing: "Ads / Marketing",
    chido_sensitive: "Chido sensible",
    general_action: "Acción general",
  };
  return map[String(scope ?? "")] ?? "Acción detectada";
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
  const partial = integrations.filter((item) => item.status === "partial");
  const blockingActions = useMemo(() => actions.filter((item) => BLOCKING_STATUSES.has(item.status)), [actions]);
  const productionAction = useMemo(() => actions.find(isReadyForProduction) ?? null, [actions]);
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
    void loadRuntime();
    return () => { abortRef.current?.abort(); };
  }, [loadRuntime]);

  async function send(event?: { preventDefault: () => void }) {
    event?.preventDefault();
    const prompt = input.trim();
    if (!prompt || isSending) return;

    const actionLike = shouldAllowActionDraft(prompt);
    const userMsg: Msg = { id: id(), role: "user", content: prompt, createdAt: Date.now() };
    const novaId = id();

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
          id: id(),
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

  function DraftCard({ draft }: { draft: ChatActionDraft }) {
    const flow = Array.isArray(draft.draft?.proposed_flow) ? draft.draft?.proposed_flow ?? [] : [];
    const safe = draft.executed === false && draft.enqueued === false;

    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-sky-300/20 bg-sky-300/[0.055] shadow-[0_18px_60px_rgba(14,165,233,0.10)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sky-300/10 text-sky-200">
              <Wand2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-black text-white">Preview seguro de acción</p>
              <p className="text-[11px] text-slate-400">{formatScope(draft.scope)} · {String(draft.owner_agi ?? "nova").toUpperCase()}</p>
            </div>
          </div>

          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${safe ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-amber-300/30 bg-amber-300/10 text-amber-100"}`}>
            {safe ? "sin ejecución" : "revisión"}
          </span>
        </div>

        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-slate-100">{compact(draft.draft?.title || draft.reason || "NOVA preparó un borrador seguro.")}</p>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Herramienta</p>
              <p className="mt-1 text-sm font-bold text-white">{draft.tool_key || "Preparación"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Riesgo</p>
              <p className="mt-1 text-sm font-bold text-white">{draft.risk_level || "medium"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Owner Gate</p>
              <p className="mt-1 text-sm font-bold text-white">{draft.draft?.owner_gate_required ? "Requerido" : "No definido"}</p>
            </div>
          </div>

          {flow.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Flujo propuesto</p>
              <div className="space-y-2">
                {flow.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex gap-2 text-xs text-slate-300">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-black text-sky-200">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowSummary(true)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
              Ver resumen
            </button>
            <button type="button" disabled className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-500">
              Enviar a producción · requiere 12.7K-2
            </button>
            <button type="button" onClick={() => setMessages((prev) => prev.filter((msg) => msg.actions?.[0] !== draft))} className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-bold text-rose-100 hover:bg-rose-300/15">
              No enviar
            </button>
          </div>
        </div>
      </div>
    );
  }

  function RuntimeActionCard({ action }: { action: RuntimeAction }) {
    const info = summarizeAction(action);
    const loading = busyAction === action.id;

    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/52 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">{action.title}</p>
            <p className="mt-1 text-xs text-slate-400">{action.agi_id.toUpperCase()} · {action.tool_key || "sin herramienta"} · {action.action_type}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(action.status)}`}>
            {action.status}
          </span>
        </div>

        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-xl bg-white/[0.04] p-2 text-slate-300"><b className="text-slate-100">Repo:</b> {info.repo}</div>
          <div className="rounded-xl bg-white/[0.04] p-2 text-slate-300"><b className="text-slate-100">Rama:</b> {info.branch}</div>
          <div className="rounded-xl bg-white/[0.04] p-2 text-slate-300"><b className="text-slate-100">Ruta:</b> {info.path}</div>
        </div>

        {action.execution_error ? (
          <p className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs text-rose-100">{action.execution_error}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowSummary(true)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
            Ver resumen
          </button>

          {(action.status === "needs_approval" || action.status === "ready_for_production" || action.status === "production_ready") ? (
            <button type="button" disabled={loading} onClick={() => void mutateAction(action, "approve")} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-50">
              {loading ? "Procesando…" : "Enviar a producción"}
            </button>
          ) : null}

          {action.status === "approved" ? (
            <button type="button" disabled={loading} onClick={() => void mutateAction(action, "execute")} className="rounded-xl bg-sky-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-sky-200 disabled:opacity-50">
              {loading ? "Ejecutando…" : "Ejecutar worker seguro"}
            </button>
          ) : null}

          {BLOCKING_STATUSES.has(action.status) ? (
            <button type="button" disabled={loading} onClick={() => void mutateAction(action, "reject")} className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-bold text-rose-100 hover:bg-rose-300/15 disabled:opacity-50">
              No enviar
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[68dvh] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/72 shadow-2xl">
      <div className="border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-sky-300/25 bg-sky-300/10 text-sky-100 shadow-[0_0_32px_rgba(56,189,248,0.18)]">
              <Sparkles className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-black text-white">NOVA Chat</h2>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                  nativo
                </span>
              </div>
              <p className="truncate text-xs text-slate-400">Habla natural. NOVA prepara, valida y muestra controles solo cuando aplican.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${effectiveLock.locked ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"}`}>
              {effectiveLock.locked ? "cola ocupada" : "cola limpia"}
            </span>
            <button type="button" onClick={() => setShowSummary((value) => !value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10">
              <PanelRight className="mr-1.5 inline h-3.5 w-3.5" />
              Estado
            </button>
            <button type="button" onClick={() => void loadRuntime()} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-white/10">
              <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" />
              Actualizar
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500"><ShieldCheck className="h-3.5 w-3.5" /> Seguridad</p>
            <p className="mt-1 text-sm font-bold text-white">{effectiveLock.reason || "Sistema protegido por Owner Gate."}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500"><Activity className="h-3.5 w-3.5" /> Runtime</p>
            <p className="mt-1 text-sm font-bold text-white">{configured.length}/{integrations.length || summary?.counts?.tools_total || 0} herramientas conectadas</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500"><Brain className="h-3.5 w-3.5" /> Acciones</p>
            <p className="mt-1 text-sm font-bold text-white">{blockingActions.length} pendientes · {actions.length} recientes</p>
          </div>
        </div>
      </div>

      {showSummary ? (
        <aside className="border-b border-white/10 bg-slate-950/55 px-4 py-3 sm:px-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-white">Estado operativo</p>
                <span className="text-[11px] text-slate-500">Proyecto: {projectId}</span>
              </div>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">AGIs: <b className="text-white">{summary?.counts?.agents ?? "—"}</b></div>
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">Runs: <b className="text-white">{summary?.counts?.runs ?? "—"}</b></div>
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">Acciones: <b className="text-white">{summary?.counts?.actions ?? actions.length}</b></div>
                <div className="rounded-xl bg-slate-950/45 p-3 text-slate-300">Parciales: <b className="text-white">{partial.length}</b></div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="mb-3 text-sm font-black text-white">Herramientas visibles</p>
              <div className="flex flex-wrap gap-2">
                {integrations.slice(0, 10).map((item) => (
                  <span key={item.tool_key} className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusTone(item.status)}`}>
                    {item.name}
                  </span>
                ))}
                {integrations.length === 0 ? <span className="text-xs text-slate-500">Sin resumen cargado todavía.</span> : null}
              </div>
            </div>
          </div>
        </aside>
      ) : null}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-center py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-[1.4rem] border border-sky-300/25 bg-sky-300/10 text-sky-100 shadow-[0_0_50px_rgba(14,165,233,0.18)]">
              <Bot className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-2xl font-black text-white">¿Qué quieres que haga NOVA?</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Puedes pedir estrategia, revisión, código, investigación o preparación de acciones. Si requiere ejecución real, NOVA mostrará una tarjeta segura antes de tocar cualquier integración.
            </p>

            <div className="mt-6 grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {NATIVE_CAPABILITIES.slice(0, 8).map((capability) => (
                <button
                  key={capability.key}
                  type="button"
                  onClick={() => applyCapability(capability)}
                  className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-sky-300/25 hover:bg-sky-300/10"
                >
                  <span className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-sky-200 group-hover:bg-sky-300/15">
                    {capabilityIcon(capability.key)}
                  </span>
                  <span className="block text-sm font-black text-white">{capability.label}</span>
                  <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${statusTone(capability.status.toLowerCase())}`}>
                    {capability.status}
                  </span>
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
                    <DraftCard key={`${msg.id}-draft-${index}`} draft={draft} />
                  ))}
                </div>
              </div>
            ))}

            {productionAction ? (
              <RuntimeActionCard action={productionAction} />
            ) : null}
          </div>
        )}
      </div>

      {blockingActions.length > 0 ? (
        <div className="border-t border-white/10 bg-slate-950/50 px-4 py-3 sm:px-5">
          <div className="mx-auto max-w-5xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-100">
              <LockKeyhole className="h-4 w-4" />
              Hay acciones pendientes. NOVA puede explicar y preparar, pero no debe mezclar procesos.
            </div>
            <div className="grid gap-3">
              {blockingActions.slice(0, 2).map((action) => (
                <RuntimeActionCard key={action.id} action={action} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {latestDraft ? (
        <div className="border-t border-white/10 bg-sky-300/[0.035] px-4 py-2 text-center text-xs text-sky-100">
          Preview activo: {formatScope(latestDraft.scope)} · no se ejecutó nada.
        </div>
      ) : null}

      {error ? (
        <div className="border-t border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          <XCircle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : null}

      <form onSubmit={(event) => void send(event)} className="border-t border-white/10 bg-slate-950/82 p-3 backdrop-blur-xl sm:p-4">
        {showCapabilities ? (
          <div className="mb-3 grid gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-2 lg:grid-cols-5">
            {NATIVE_CAPABILITIES.map((capability) => (
              <button
                key={capability.key}
                type="button"
                onClick={() => applyCapability(capability)}
                title={capability.detail}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-left text-xs font-bold text-slate-200 hover:border-sky-300/25 hover:bg-sky-300/10"
              >
                {capabilityIcon(capability.key)}
                <span>{capability.label}</span>
              </button>
            ))}
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
          <span>Enter envía · Shift + Enter agrega línea.</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            Sin ejecución oculta · Owner Gate activo
          </span>
        </div>
      </form>
    </div>
  );
}
