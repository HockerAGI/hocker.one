"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

type JsonRecord = Record<string, unknown>;

type WorkerTask = {
  id: string;
  agi_id?: string | null;
  title?: string | null;
  details?: string | null;
  status?: string | null;
  priority?: string | null;
  task_type?: string | null;
  assigned_to?: string | null;
  request_id?: string | null;
  write_policy?: string | null;
  attempt_count?: number | null;
  max_attempts?: number | null;
  locked_at?: string | null;
  lock_owner?: string | null;
  completed_at?: string | null;
  result_hash?: string | null;
  error?: string | null;
  output?: JsonRecord | null;
  evidence?: unknown[] | null;
  created_at?: string | null;
};

type WorkerRun = {
  id: string;
  task_id?: string | null;
  status?: string | null;
  provider?: string | null;
  model?: string | null;
  attempt?: number | null;
  worker_id?: string | null;
  result_hash?: string | null;
  error?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
};

type WorkerLoop = {
  enabled?: boolean;
  running?: boolean;
  worker_id?: string;
  assigned_agi?: string | null;
  interval_ms?: number;
  last_tick_at?: string | null;
  last_task_id?: string | null;
  last_result_hash?: string | null;
  last_error?: string | null;
};

type ConsolePayload = {
  ok?: boolean;
  project_id?: string;
  schema_query_ready?: boolean;
  schema_query_error?: string | null;
  status_http?: number;
  status?: {
    ok?: boolean;
    schema_ready?: boolean;
    reason?: string | null;
    loop?: WorkerLoop;
    execution_policy?: JsonRecord;
    error?: string;
    execution_blocked?: boolean;
    stale_backlog?: {
      checked: boolean;
      blocked: boolean;
      stale_count: number | null;
      threshold_hours: number;
      reason: string | null;
    };
  };
  tasks?: WorkerTask[];
  totals?: {
    ready: boolean;
    counts: Record<"queued" | "pending" | "working" | "completed" | "failed", number> | null;
  };
  stale_review?: {
    ready: boolean;
    items: WorkerTask[];
    truncated: boolean;
  };
  operational_gates?: {
    context_bridge: { current_sources: number | null; required_sources: number; max_age_hours: number };
    runtime: { fresh_nodes: number | null; heartbeat_window_minutes: number };
  };
  runs?: WorkerRun[];
  error?: string;
};

const AGI_OPTIONS = [
  ["syntia", "Syntia · memoria y contexto"],
  ["vertx", "Vertx · seguridad y gobernanza"],
  ["hostia", "Hostia · infraestructura e integraciones"],
  ["jurix", "Jurix · legal y cumplimiento"],
  ["numia", "Numia · finanzas y costos"],
  ["nova_ads", "Nova Ads · marketing y campañas"],
  ["candy_ads", "Candy Ads · creatividad visual"],
  ["pro_ia", "PRO IA · producción audiovisual"],
  ["curvewind", "Curvewind · estrategia y predicción"],
  ["revia", "Revia · ventas y conversión"],
  ["trackhok", "TrackHok · monitoreo"],
  ["nexpa", "NEXPA · seguridad humana"],
  ["chido_wins", "Chido Wins · riesgo y simulación"],
  ["chido_gerente", "Chido Gerente · operación casino"],
  ["shadows", "Shadows · tareas temporales"],
] as const;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function text(value: unknown, fallback = "—") {
  const clean = typeof value === "string" ? value.trim() : "";
  return clean || fallback;
}

function date(value: unknown) {
  if (typeof value !== "string" || !value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("es-MX");
}

function statusClass(status: string) {
  if (status === "completed") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (status === "working") return "border-cyan-300/25 bg-cyan-300/10 text-cyan-100";
  if (status === "queued") return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  if (status === "failed") return "border-rose-300/25 bg-rose-300/10 text-rose-100";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

function statusLabel(status: string) {
  if (status === "completed") return "Completada";
  if (status === "working") return "En ejecución";
  if (status === "queued" || status === "pending") return "Pendiente";
  if (status === "canceled") return "Cancelada";
  if (status === "failed") return "Con error";
  return status || "Sin estado";
}

function policyLabel(value: string | null | undefined) {
  if (value === "draft_only") return "Solo borradores";
  if (value === "read_only") return "Solo lectura";
  if (value === "owner_gate") return "Solicita autorización";
  return "No especificada";
}

/** Render the model's plain text/markdown-like output as readable, escaped React nodes. */
function ResultText({ value }: { value: string }) {
  const paragraphs = value
    .replace(/\r\n/g, "\n")
    .replace(/\s+(?=\d{1,2}\.\s+\*\*)/g, "\n")
    .split(/\n+/)
    .map((piece) => piece.trim())
    .filter(Boolean);
  return (
    <div className="space-y-3 break-words text-sm leading-7 text-slate-300">
      {paragraphs.map((piece, i) => (
        <p key={i}>
          {piece.split(/\*\*([^*]+)\*\*/g).map((part, j) =>
            j % 2 ? <strong key={j} className="font-semibold text-slate-100">{part}</strong> : part)}
        </p>
      ))}
    </div>
  );
}

async function requestConsole(init?: RequestInit): Promise<ConsolePayload> {
  const response = await fetch("/api/agi/workers?project_id=hocker-one", {
    cache: "no-store",
    credentials: "include",
    ...init,
  });
  const payload = await response.json().catch(() => ({})) as ConsolePayload;
  if (!response.ok) throw new Error(payload.error || "No se pudo consultar trabajadores AGI.");
  return payload;
}

export default function VerifiableWorkersConsole() {
  const [data, setData] = useState<ConsolePayload>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"create" | "run" | "recover" | null>(null);
  const [message, setMessage] = useState("");
  const [agi, setAgi] = useState("syntia");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [writePolicy, setWritePolicy] = useState("draft_only");
  const [visibleRecent, setVisibleRecent] = useState(6);
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({});
  const [cancelBusy, setCancelBusy] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<string>("");

  const refresh = useCallback(async () => {
    try {
      const payload = await requestConsole();
      setData(payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el panel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 20_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const tasks = useMemo(() => Array.isArray(data.tasks) ? data.tasks : [], [data.tasks]);
  const runs = useMemo(() => Array.isArray(data.runs) ? data.runs : [], [data.runs]);
  const totals = data.totals?.ready === true ? data.totals.counts : null;
  const pendingTotal = totals ? totals.queued + totals.pending : null;
  const staleReview = data.stale_review;
  const staleTasks = staleReview?.ready === true ? staleReview.items : [];
  const gateSummary = data.operational_gates;
  const loop = data.status?.loop ?? {};
  const schemaReady = data.status?.schema_ready === true && data.schema_query_ready === true;
  const backlog = data.status?.stale_backlog;
  const executionBlocked = data.status?.execution_blocked !== false || backlog?.blocked !== false;

  async function postAction(payload: JsonRecord, action: typeof busy) {
    setBusy(action);
    setMessage("");
    try {
      const response = await fetch("/api/agi/workers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({})) as JsonRecord;
      if (!response.ok) throw new Error(text(result.error, "La operación no pudo completarse."));
      setMessage(
        action === "create"
          ? `Tarea registrada: ${text(result.task_id, "sin ID")}`
          : action === "run"
            ? result.processed === true
              ? `Trabajo completado: ${text(asRecord(result.task).id, "sin ID")}`
              : "No había tareas elegibles en cola."
            : `Locks recuperados: ${Number(result.recovered ?? 0)}`,
      );
      if (action === "create") {
        setSubject("");
        setBody("");
      }
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La operación no pudo completarse.");
    } finally {
      setBusy(null);
    }
  }

  async function cancelOldTask(task: WorkerTask) {
    const reason = (cancelReasons[task.id] ?? "").trim();
    if (reason.length < 12 || reason.length > 400) {
      setCancelFeedback("Escribe un motivo de 12 a 400 caracteres para esta tarea.");
      return;
    }
    if (!window.confirm(`¿Cancelar únicamente "${text(task.title)}"? Esta acción conserva historial y no ejecuta modelos.`)) return;
    setCancelBusy(task.id);
    setCancelFeedback("");
    try {
      const response = await fetch("/api/agi/workers", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operation: "cancel_stale",
          project_id: "hocker-one",
          task_id: task.id,
          reason,
        }),
      });
      const payload = await response.json().catch(() => ({})) as JsonRecord;
      if (!response.ok || payload.ok !== true) {
        const code = text(payload.error, "AGI_STALE_TASK_REVIEW_UNAVAILABLE");
        if (code === "owner_mfa_required" || response.status === 403) {
          throw new Error("La acción requiere verificar MFA AAL2 en tu sesión Owner.");
        }
        throw new Error(text(payload.message, "No se pudo cancelar el registro. Comprueba su estado."));
      }
      setCancelFeedback(`Tarea cancelada con registro de auditoría: ${task.id}`);
      setCancelReasons((current) => ({ ...current, [task.id]: "" }));
      await refresh();
    } catch (error) {
      setCancelFeedback(error instanceof Error ? error.message : "Cancelación no completada.");
    } finally {
      setCancelBusy(null);
    }
  }

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    await postAction({
      operation: "create",
      project_id: "hocker-one",
      to_agi: agi,
      subject: subject.trim(),
      body: body.trim(),
      intent: agi === "numia" ? "finance" : ["hostia", "vertx", "trackhok"].includes(agi) ? "ops" : "general",
      priority,
      write_policy: writePolicy,
      context: {
        source: "hocker.one.workers-console",
        requested_from_ui: true,
      },
    }, "create");
  }

  if (loading) {
    return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-cyan-200" /></div>;
  }

  return (
    <div className="space-y-5">
      <section aria-label="Resumen de trabajos" className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { label: "Pendientes", value: pendingTotal, note: "Incluye trabajos antiguos", tone: "text-amber-200" },
          { label: "En ejecución", value: totals?.working, note: "Procesando ahora", tone: "text-cyan-200" },
          { label: "Completadas", value: totals?.completed, note: "Total registrado", tone: "text-emerald-200" },
          { label: "Con errores", value: totals?.failed, note: "Total registrado", tone: "text-rose-200" },
        ].map((metric) => (
          <div key={metric.label} className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 sm:p-4">
            <p className="text-xs font-semibold text-slate-400">{metric.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${metric.tone}`}>
              {typeof metric.value === "number" ? metric.value : "—"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">{metric.note}</p>
          </div>
        ))}
      </section>
      <p className="text-xs leading-5 text-slate-400">
        Totales del proyecto, no una muestra de las últimas tareas. Base de datos:
        {" "}<strong className="text-slate-200">{schemaReady ? "disponible" : "verificar"}</strong>.
        Ejecución automática: <strong className="text-slate-200">{loop.enabled ? "activada" : "apagada"}</strong>.
      </p>

      <section aria-label="Qué falta para operar" className="grid gap-2 sm:grid-cols-3">
        <a href="#revision-pendientes" className="min-w-0 rounded-xl border border-white/10 bg-slate-950/40 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <p className="text-xs font-semibold text-slate-300">1. Cola histórica</p>
          <p className="mt-1 text-sm font-bold text-white">{pendingTotal === null ? "Sin verificar" : `${pendingTotal} por revisar`}</p>
          <p className="mt-1 text-xs text-slate-500">Revisar sin ejecutar</p>
        </a>
        <Link href="/owner/context-bridge" className="min-w-0 rounded-xl border border-white/10 bg-slate-950/40 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <p className="text-xs font-semibold text-slate-300">2. Continuidad</p>
          <p className="mt-1 text-sm font-bold text-white">
            {typeof gateSummary?.context_bridge.current_sources === "number"
              ? `${gateSummary.context_bridge.current_sources}/6 fuentes vigentes`
              : "Sin verificar"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Ver evidencias y MFA</p>
        </Link>
        <Link href="/nodes" className="min-w-0 rounded-xl border border-white/10 bg-slate-950/40 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <p className="text-xs font-semibold text-slate-300">3. Runtime NOVA</p>
          <p className="mt-1 text-sm font-bold text-white">
            {typeof gateSummary?.runtime.fresh_nodes === "number"
              ? `${gateSummary.runtime.fresh_nodes} nodos con señal reciente`
              : "Sin verificar"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Revisar nodos y salud</p>
        </Link>
      </section>

      {executionBlocked ? (
        <section role="status" className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.065] px-4 py-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="font-semibold leading-snug text-amber-100">NOVA no procesará trabajos antiguos automáticamente</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {backlog?.checked === true
                  ? `Hay ${backlog.stale_count ?? 0} trabajos de más de ${backlog.threshold_hours} horas por revisar.`
                  : "No se pudo comprobar toda la cola. La ejecución permanece bloqueada por seguridad."}
                {" "}Ninguna tarea se ha cancelado al abrir esta pantalla.
              </p>
              <a href="#revision-pendientes" className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-amber-200/30 px-4 text-sm font-semibold text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
                Revisar trabajos pendientes
              </a>
              <details className="mt-2 text-xs leading-5 text-slate-400">
                <summary className="min-h-8 cursor-pointer py-1 font-medium text-slate-300">¿Por qué está bloqueado?</summary>
                Este control impide retomar tareas de pruebas antiguas o recuperar bloqueos sin revisión del propietario.
                También protege las rutas internas y por token. No es un fallo del diseño ni de las AGIs.
              </details>
            </div>
          </div>
        </section>
      ) : null}

      {!schemaReady ? (
        <section className="rounded-[28px] border border-amber-300/20 bg-amber-300/[0.07] p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <h2 className="font-black text-amber-50">El código está preparado, pero el esquema todavía no está activo.</h2>
              <p className="mt-2 text-sm leading-6 text-amber-100/75">
                Aplica la migración versionada únicamente después de revisar Supabase. Hasta entonces NOVA fallará de forma cerrada y no reclamará tareas.
              </p>
              <p className="mt-2 text-xs text-amber-200/60">{text(data.status?.reason || data.schema_query_error, "AGI_WORKER_SCHEMA_NOT_READY")}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section id="revision-pendientes" className="scroll-mt-32 rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-cyan-300">Revisión del propietario</p>
            <h2 className="mt-1 text-lg font-bold text-white">Trabajos antiguos pendientes</h2>
          </div>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-sm font-semibold text-amber-200">
            {backlog?.checked ? `${backlog.stale_count ?? 0} por revisar` : "Sin verificar"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Estos trabajos se guardaron anteriormente. Puedes revisar y cancelar una tarea individual
          con un motivo explícito, MFA Owner y auditoría. No se ejecuta ningún modelo.
          Las autorizaciones de cambios sensibles se administran por separado en
          {" "}<Link href="/owner/actions" className="font-medium text-cyan-200 underline underline-offset-4">Aprobaciones</Link>.
        </p>
        {cancelFeedback ? <p role="status" className="mt-3 rounded-xl border border-white/15 bg-white/[0.035] p-3 text-sm text-slate-200">{cancelFeedback}</p> : null}
        {staleReview?.ready === false || !staleReview ? (
          <p role="status" className="mt-3 text-sm text-amber-200">No se pudo cargar el inventario. No interpretes esta pantalla como una cola vacía.</p>
        ) : staleTasks.length ? (
          <div className="mt-4 space-y-2">
            {staleTasks.map((task) => (
              <details key={task.id} className="rounded-xl border border-white/10 bg-black/20">
                <summary className="cursor-pointer px-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:px-4">
                  <span className="block text-sm font-semibold text-slate-100">{text(task.title)}</span>
                  <span className="mt-1 block text-xs text-slate-400">{text(task.agi_id || task.assigned_to)} · {statusLabel(text(task.status))} · {date(task.created_at)}</span>
                </summary>
                <div className="border-t border-white/10 px-3 py-3 text-xs leading-6 text-slate-300 sm:px-4">
                  <p>Tipo: {text(task.task_type)} · Permiso: {policyLabel(task.write_policy)}</p>
                  <p>Intentos: {task.attempt_count ?? 0} de {task.max_attempts ?? 3}</p>
                  <p>Identificador: <code className="break-all text-slate-400">{task.id}</code></p>
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                    <label className="block">
                      <span className="mb-1 block font-medium text-slate-300">Motivo de cancelación (obligatorio)</span>
                      <textarea
                        value={cancelReasons[task.id] ?? ""}
                        onChange={(event) => setCancelReasons((current) => ({ ...current, [task.id]: event.target.value }))}
                        maxLength={400} rows={2}
                        placeholder="Ej. Pulso de prueba de agosto; se revisó y no debe reactivarse."
                        className="w-full rounded-xl border border-white/15 bg-slate-950/70 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      />
                    </label>
                    <button type="button" onClick={() => void cancelOldTask(task)}
                      disabled={cancelBusy !== null || (cancelReasons[task.id] ?? "").trim().length < 12}
                      className="min-h-11 rounded-xl border border-amber-300/25 px-4 text-sm font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-40">
                      {cancelBusy === task.id ? "Cancelando…" : "Cancelar solo esta tarea"}
                    </button>
                    <p className="text-xs text-slate-500">Se conserva el historial. Solo Owner con MFA puede confirmar; nunca se cancela en bloque.</p>
                  </div>
                </div>
              </details>
            ))}
            {staleReview.truncated ? <p className="text-sm text-amber-200">Inventario parcial: supera los 100 registros. No se permite depuración masiva.</p> : null}
          </div>
        ) : <p className="mt-3 text-sm text-emerald-300">No se encontraron trabajos antiguos en esta revisión.</p>}
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <details className="hocker-panel-pro p-4 sm:p-5">
          <summary className="cursor-pointer text-base font-semibold text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
            Crear una tarea nueva (opcional)
          </summary>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Registrar una tarea no la ejecuta. Si hay trabajos antiguos pendientes, la ejecución seguirá bloqueada.
          </p>
          <form onSubmit={createTask} className="mt-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-300/10 text-violet-200"><Sparkles className="h-5 w-5" /></span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300">Nueva tarea verificable</p>
              <h2 className="mt-1 text-xl font-black text-white">Asignar trabajo especializado</h2>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-300">Perfil responsable</span>
              <select value={agi} onChange={(event) => setAgi(event.target.value)} className="hocker-focus-ring w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none">
                {AGI_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-300">Objetivo</span>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={240} placeholder="Ej. Auditar continuidad de proveedores IA" className="hocker-focus-ring w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-300">Datos e instrucciones</span>
              <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={20_000} placeholder="Incluye hechos, fuentes disponibles y resultado esperado. El trabajador no inventará acceso a información que no esté aquí." className="hocker-focus-ring min-h-36 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-bold text-slate-300">Prioridad</span>
                <select value={priority} onChange={(event) => setPriority(event.target.value)} className="hocker-focus-ring w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none">
                  <option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option><option value="critical">Crítica</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold text-slate-300">Política</span>
                <select value={writePolicy} onChange={(event) => setWritePolicy(event.target.value)} className="hocker-focus-ring w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none">
                  <option value="read_only">Solo análisis</option>
                  <option value="draft_only">Análisis + borradores</option>
                  <option value="owner_gate">Puede solicitar Owner Gate</option>
                </select>
              </label>
            </div>
          </div>

          <button disabled={busy !== null || !schemaReady || !subject.trim() || !body.trim()} className="hocker-button-primary mt-5 inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50" type="submit">
            {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Registrar tarea
          </button>
          </form>
        </details>

        <div className="space-y-4">
          <section className="hocker-panel-pro p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Control Owner</p>
                <h2 className="mt-1 text-xl font-black text-white">Ejecución y recuperación</h2>
                <p className="mt-2 text-sm text-slate-400">Procesar inicia una tarea con el modelo; recuperar libera tareas interrumpidas. Ambas acciones requieren MFA y permanecen deshabilitadas mientras exista trabajo antiguo sin revisar.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy !== null || !schemaReady || executionBlocked} onClick={() => void postAction({ operation: "run_once", project_id: "hocker-one", assigned_agi: null }, "run")} className="hocker-button-primary inline-flex min-h-11 items-center gap-2 disabled:cursor-not-allowed disabled:!bg-slate-800 disabled:!text-slate-400 disabled:opacity-50">
                  {busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Procesar siguiente
                </button>
                <button type="button" disabled={busy !== null || !schemaReady || executionBlocked} onClick={() => void postAction({ operation: "recover_stale", project_id: "hocker-one" }, "recover")} className="hocker-button-secondary inline-flex min-h-11 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40">
                  {busy === "recover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Recuperar locks
                </button>
                <button type="button" onClick={() => void refresh()} className="hocker-button-secondary inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Actualizar</button>
              </div>
            </div>
            {message ? <p className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-3 text-sm text-cyan-50">{message}</p> : null}
          </section>

          <section className="hocker-panel-pro overflow-hidden">
            <div className="border-b border-white/[0.07] p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Cola y evidencia</p>
              <h2 className="mt-1 text-xl font-black text-white">Resultados recientes</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">Muestra limitada a 60 registros; abre un resultado solo si necesitas leerlo completo.</p>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {tasks.slice(0, visibleRecent).map((task) => {
                const output = asRecord(task.output);
                const summary = text(output.summary, "Todavía no hay resultado.");
                const preview = summary.replace(/\*\*/g, "").replace(/\s+/g, " ").trim().slice(0, 185);
                const verification = asRecord(output.verification);
                const taskRuns = runs.filter((run) => run.task_id === task.id);
                return (
                  <article key={task.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${statusClass(text(task.status, "unknown"))}`}>{statusLabel(text(task.status, "unknown"))}</span>
                          <span className="rounded-full border border-violet-300/15 bg-violet-300/[0.07] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-violet-100">{text(task.agi_id || task.assigned_to)}</span>
                          <span className="text-[10px] text-slate-500">{text(task.priority, "normal")}</span>
                        </div>
                        <h3 className="mt-3 text-base font-black text-white">{text(task.title)}</h3>
                        <p className="mt-2 break-words text-sm leading-6 text-slate-400">
                          {preview}{summary.length > 185 ? "…" : ""}
                        </p>
                        {summary.length > 185 ? (
                          <details className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                            <summary className="min-h-9 cursor-pointer py-1 text-sm font-semibold text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                              Leer resultado completo
                            </summary>
                            <div className="mt-3 border-t border-white/10 pt-3"><ResultText value={summary} /></div>
                          </details>
                        ) : null}
                      </div>
                      {task.status === "completed" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" /> : task.status === "failed" ? <XCircle className="h-5 w-5 shrink-0 text-rose-300" /> : <Bot className="h-5 w-5 shrink-0 text-cyan-300" />}
                    </div>

                    <details className="mt-3 rounded-xl border border-white/10 bg-slate-950/35 p-3">
                      <summary className="min-h-9 cursor-pointer py-1 text-sm font-medium text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                        Datos técnicos y trazabilidad
                      </summary>
                      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-500">Intentos</p><p className="mt-1 text-xs font-bold text-white">{Number(task.attempt_count ?? 0)} / {Number(task.max_attempts ?? 3)}</p></div>
                      <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-500">Política</p><p className="mt-1 text-xs font-bold text-white">{policyLabel(task.write_policy)}</p></div>
                      <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-500">Evidencias</p><p className="mt-1 text-xs font-bold text-white">{Array.isArray(task.evidence) ? task.evidence.length : 0}</p></div>
                      <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-500">Runs</p><p className="mt-1 text-xs font-bold text-white">{taskRuns.length}</p></div>
                    </div>

                      <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-xs leading-5 text-slate-400">
                        <p className="flex items-start gap-2"><Fingerprint className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Task: {task.id}</p>
                        <p className="flex items-start gap-2"><FileCheck2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Request: {text(task.request_id)}</p>
                        <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Hash: {text(task.result_hash || verification.result_hash)}</p>
                        <p>Creada: {date(task.created_at)} · Terminada: {date(task.completed_at)}</p>
                        {task.error ? <p className="text-rose-200">Error: {task.error}</p> : null}
                        {taskRuns.map((run) => <p key={run.id}>Run {run.id}: {text(run.provider)} / {text(run.model)} · {text(run.status)}</p>)}
                      </div>
                    </details>
                  </article>
                );
              })}
              {tasks.length > visibleRecent ? (
                <div className="p-4 text-center">
                  <button type="button" onClick={() => setVisibleRecent((count) => count + 6)}
                    className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                    Mostrar seis registros más ({Math.max(0, tasks.length - visibleRecent)} restantes)
                  </button>
                </div>
              ) : null}
              {tasks.length === 0 ? <div className="p-10 text-center"><Bot className="mx-auto h-8 w-8 text-slate-700" /><p className="mt-3 text-sm text-slate-500">Todavía no hay tareas verificables.</p></div> : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
