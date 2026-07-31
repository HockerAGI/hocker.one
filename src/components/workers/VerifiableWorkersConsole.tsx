"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
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
  };
  tasks?: WorkerTask[];
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
  if (status === "working") return "Trabajando";
  if (status === "queued") return "En cola";
  if (status === "failed") return "Falló";
  return status || "Sin estado";
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
  const counts = useMemo(() => tasks.reduce((current, task) => {
    const key = text(task.status, "unknown");
    current[key] = (current[key] ?? 0) + 1;
    return current;
  }, {} as Record<string, number>), [tasks]);
  const loop = data.status?.loop ?? {};
  const schemaReady = data.status?.schema_ready === true && data.schema_query_ready === true;

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
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="hocker-panel-pro p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Esquema</p>
          <div className="mt-3 flex items-center gap-2">
            {schemaReady ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <AlertTriangle className="h-5 w-5 text-amber-300" />}
            <strong className="text-sm text-white">{schemaReady ? "Preparado" : "No aplicado"}</strong>
          </div>
        </div>
        <div className="hocker-panel-pro p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">En cola</p>
          <p className="mt-2 text-3xl font-black text-amber-200">{counts.queued ?? 0}</p>
        </div>
        <div className="hocker-panel-pro p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Trabajando</p>
          <p className="mt-2 text-3xl font-black text-cyan-200">{counts.working ?? 0}</p>
        </div>
        <div className="hocker-panel-pro p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Completadas</p>
          <p className="mt-2 text-3xl font-black text-emerald-200">{counts.completed ?? 0}</p>
        </div>
        <div className="hocker-panel-pro p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Loop automático</p>
          <div className="mt-3 flex items-center gap-2">
            {loop.enabled ? <Activity className="h-5 w-5 text-emerald-300" /> : <Clock3 className="h-5 w-5 text-slate-500" />}
            <strong className="text-sm text-white">{loop.enabled ? loop.running ? "Procesando" : "Activo" : "Desactivado"}</strong>
          </div>
        </div>
      </section>

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

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <form onSubmit={createTask} className="hocker-panel-pro p-5 sm:p-6">
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

        <div className="space-y-4">
          <section className="hocker-panel-pro p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Control Owner</p>
                <h2 className="mt-1 text-xl font-black text-white">Ejecución y recuperación</h2>
                <p className="mt-2 text-sm text-slate-400">El modo manual procesa una tarea. El loop automático permanece desactivado hasta configurarlo.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy !== null || !schemaReady} onClick={() => void postAction({ operation: "run_once", project_id: "hocker-one", assigned_agi: null }, "run")} className="hocker-button-primary inline-flex items-center gap-2 disabled:opacity-50">
                  {busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Procesar siguiente
                </button>
                <button type="button" disabled={busy !== null || !schemaReady} onClick={() => void postAction({ operation: "recover_stale", project_id: "hocker-one" }, "recover")} className="hocker-button-secondary inline-flex items-center gap-2 disabled:opacity-50">
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
              <h2 className="mt-1 text-xl font-black text-white">Tareas recientes</h2>
            </div>
            <div className="max-h-[720px] divide-y divide-white/[0.07] overflow-y-auto hko-sidebar-scroll">
              {tasks.map((task) => {
                const output = asRecord(task.output);
                const summary = text(output.summary, "Todavía no hay resultado.");
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
                        <p className="mt-2 text-sm leading-6 text-slate-400">{summary}</p>
                      </div>
                      {task.status === "completed" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" /> : task.status === "failed" ? <XCircle className="h-5 w-5 shrink-0 text-rose-300" /> : <Bot className="h-5 w-5 shrink-0 text-cyan-300" />}
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-500">Intentos</p><p className="mt-1 text-xs font-bold text-white">{Number(task.attempt_count ?? 0)} / {Number(task.max_attempts ?? 3)}</p></div>
                      <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-500">Política</p><p className="mt-1 text-xs font-bold text-white">{text(task.write_policy)}</p></div>
                      <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-500">Evidencias</p><p className="mt-1 text-xs font-bold text-white">{Array.isArray(task.evidence) ? task.evidence.length : 0}</p></div>
                      <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3"><p className="text-[9px] uppercase tracking-widest text-slate-500">Runs</p><p className="mt-1 text-xs font-bold text-white">{taskRuns.length}</p></div>
                    </div>

                    <details className="mt-3 rounded-2xl border border-white/[0.07] bg-slate-950/35 p-3">
                      <summary className="cursor-pointer text-xs font-bold text-cyan-100">Ver trazabilidad</summary>
                      <div className="mt-3 space-y-2 text-xs leading-5 text-slate-400">
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
              {tasks.length === 0 ? <div className="p-10 text-center"><Bot className="mx-auto h-8 w-8 text-slate-700" /><p className="mt-3 text-sm text-slate-500">Todavía no hay tareas verificables.</p></div> : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
