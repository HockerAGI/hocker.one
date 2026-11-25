"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import OwnerInlineActionReview from "@/components/OwnerInlineActionReview";

type RuntimeAction = {
  id: string;
  agi_id: string;
  tool_key: string | null;
  action_type: string;
  title: string;
  status: string;
  risk_level: string;
  dry_run: boolean;
  requires_approval: boolean;
  created_at: string;
  execution_error?: string | null;
  payload?: {
    trace_id?: string;
    materializer_version?: string;
    sequence_index?: number;
    expected_base_sha?: string;
    expected_sha?: string;
    write_plan?: {
      operation?: string;
      repository?: string;
      target_branch?: string;
      path?: string | null;
      title?: string | null;
      risk_level?: string;
      next_step?: string;
      steps?: string[];
      rollback_plan?: { steps?: string[] };
      content_preview?: { bytes?: number; lines?: number };
    };
  };
};

type ApiListResponse = { ok?: boolean; actions?: RuntimeAction[]; error?: string };
type MutateResponse = { ok?: boolean; item?: RuntimeAction; error?: string; message?: string };

type IntegrationProbe = { configured: boolean; verified_read: boolean; state: "missing" | "verification_failed" | "verified_read" };
type EngineeringIntegrations = {
  ok: true;
  checked_at: string;
  checked_environment: "production" | "preview" | "development" | "unknown";
  production_scope_verified: boolean;
  github: IntegrationProbe;
  vercel: IntegrationProbe;
  node_agent_required: false;
  owner_gate_required_for_writes: true;
  github_write_scope_verified: false;
  github_identity_kind?: "pat" | "github_app" | "missing" | "not_checked";
  github_repo_creation_identity_configured?: boolean;
  can_prepare_existing_app_proposal: boolean;
  can_prepare_new_app_bootstrap: boolean;
  blockers: string[];
};

type ActionView = "needs_approval" | "approved" | "history";
const PAGE_SIZE = 30;

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    needs_approval: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    executing: "Ejecutando",
    executed: "Ejecutada",
    execution_failed: "Falló",
  };
  return labels[status] ?? status;
}

function riskLabel(risk: string) {
  const labels: Record<string, string> = { low: "Bajo", medium: "Medio", high: "Alto", critical: "Crítico" };
  return labels[risk] ?? risk;
}

export default function OwnerApprovalCenter({ projectId, initialActionId, previewReadOnly = false }: { projectId: string; initialActionId?: string; previewReadOnly?: boolean }) {
  const [actions, setActions] = useState<RuntimeAction[]>([]);
  const [selectedId, setSelectedId] = useState(initialActionId);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [inlineReviewId, setInlineReviewId] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const mutationLock = useRef(false);
  const [message, setMessage] = useState<string>("");
  const [view, setView] = useState<ActionView>("needs_approval");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [integrations, setIntegrations] = useState<EngineeringIntegrations | null>(null);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);

  const pendingCount = view === "needs_approval" && !selectedId && !loadError ? actions.length : null;
  const groupKey = (action: RuntimeAction) => action.payload?.trace_id && Number.isInteger(action.payload.sequence_index)
    ? "batch:" + action.payload.trace_id : "action:" + action.id;
  const groupTimes = new Map<string, number>();
  for (const action of actions) {
    const key = groupKey(action);
    groupTimes.set(key, Math.max(groupTimes.get(key) ?? 0, Date.parse(action.created_at) || 0));
  }
  const orderedActions = [...actions].sort((a, b) => {
    const ak = groupKey(a); const bk = groupKey(b);
    if (ak === bk && Number.isInteger(a.payload?.sequence_index) && Number.isInteger(b.payload?.sequence_index)) {
      return Number(a.payload?.sequence_index) - Number(b.payload?.sequence_index);
    }
    return (groupTimes.get(bk) ?? 0) - (groupTimes.get(ak) ?? 0) || ak.localeCompare(bk);
  });

  const checkIntegrations = useCallback(async () => {
    setIntegrationsLoading(true);
    try {
      const params = new URLSearchParams({ project_id: projectId });
      const response = await fetch(`/api/agi/runtime/integrations/readiness?${params}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("No se pudo verificar el runtime.");
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" ||
          (result as Record<string, unknown>).ok !== true) {
        throw new Error("Contrato de verificación inválido.");
      }
      setIntegrations(result as EngineeringIntegrations);
    } catch {
      // Never show a previous green connection after auth expires or a
      // provider/API check fails. The absence of proof stays explicit.
      setIntegrations(null);
    } finally {
      setIntegrationsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void checkIntegrations();
  }, [checkIntegrations]);

  const load = useCallback(async () => {
    const request = ++requestVersion.current;
    setLoading(true);
    try {
      // Fetch the selected status before pagination. A pending approval must
      // never be hidden behind more recent closed actions.
      const params = new URLSearchParams({
        project_id: projectId,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (selectedId) params.set("action_id", selectedId);
      else if (view !== "history") params.set("status", view);
      const res = await fetch(`/api/agi/runtime/actions?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as ApiListResponse;
      if (!res.ok || data.ok !== true || !Array.isArray(data.actions)) {
        throw new Error(data.error || "No se pudo leer la cola AGI.");
      }
      if (request !== requestVersion.current) return;
      setActions(data.actions);
      setHasNext(!selectedId && data.actions.length === PAGE_SIZE);
      setLoadError(false);
    } catch (error) {
      if (request !== requestVersion.current) return;
      setActions([]);
      setHasNext(false);
      setLoadError(true);
      setMessage(error instanceof Error ? error.message : "No se pudo leer la cola AGI.");
    } finally {
      if (request === requestVersion.current) setLoading(false);
    }
  }, [projectId, view, page, selectedId]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function mutate(path: string, payload: Record<string, unknown>) {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setBusyId(String(payload.action_id ?? ""));
    setMessage("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: projectId, ...payload }),
      });
      const data = (await res.json()) as MutateResponse;
      if (!res.ok || data.ok !== true) throw new Error(res.status === 403 ? "Verifica tu sesión y MFA antes de continuar." : data.error || data.message || "Operación no completada.");
      setReviewId(null);
      await load();
      setMessage(data.message || "Operación completada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Operación no completada.");
    } finally {
      mutationLock.current = false;
      setBusyId(null);
    }
  }

  return (
    <section className="hko-approval-shell">
      <div className="hko-approval-head">
        <div>
          <h2>Acciones</h2>
          <p>Decide qué cambios pueden ejecutarse.</p>
          <span className="sr-only">Centro de aprobación AGI</span>
        </div>
        <button type="button" onClick={() => void load()} className="hko-approval-refresh" disabled={loading || Boolean(busyId)}>
          {loading ? "Consultando…" : "Actualizar"}
        </button>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4" aria-label="Preparación de integraciones de ingeniería AGI">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Ingeniería AGI sin nodo físico</h3>
            <p className="mt-1 text-xs text-slate-400">Estado real de las identidades del runtime serverless, sin secretos ni escritura.</p>
          </div>
          <button type="button" className="min-h-10 rounded-xl border border-white/15 px-3 text-xs text-slate-200 disabled:opacity-50"
            onClick={() => void checkIntegrations()} disabled={integrationsLoading}>
            {integrationsLoading ? "Verificando…" : "Verificar conexiones"}
          </button>
        </div>
        {integrations ? (
          <div className="mt-3 space-y-2 text-sm text-slate-200" role="status">
            <p className="text-xs font-semibold text-slate-300">
              Entorno comprobado: {integrations.checked_environment === "production" ? "Production" :
                integrations.checked_environment === "preview" ? "Preview" :
                  integrations.checked_environment === "development" ? "Development" : "desconocido"}.
            </p>
            {!integrations.production_scope_verified ? (
              <p className="text-xs text-amber-200">
                Este despliegue NO acredita Production. Para comprobar las identidades productivas utiliza hockerone.vercel.app.
              </p>
            ) : null}
            <p>GitHub: {integrations.github.state === "verified_read" ? "lectura autenticada verificada" :
              integrations.github.state === "missing" ? "sin identidad de runtime en Production" : "conexión sin verificar"}</p>
            <p className="text-xs text-slate-400">Identidad GitHub runtime: {integrations.github_identity_kind === "github_app"
              ? "GitHub App temporal, limitada a repos autorizados" : integrations.github_identity_kind === "pat"
                ? "token estático configurado (permisos de escritura NO certificados)" : "no verificada"}.
              {" "}Creación de repos nuevos: {integrations.github_repo_creation_identity_configured ? "identidad presente; permiso sin certificar" : "requiere identidad de organización específica"}.</p>
            <p>Vercel: {integrations.vercel.state === "verified_read" ? "lectura autenticada verificada" :
              integrations.vercel.state === "missing" ? "sin identidad de runtime en Production" : "conexión sin verificar"}</p>
            <p className="text-xs text-slate-400">
              Propuestas para apps existentes: {integrations.can_prepare_existing_app_proposal ? "preparación habilitada" : "bloqueada"}.
              {" "}Creación de nuevas apps: {integrations.can_prepare_new_app_bootstrap ? "preparación habilitada" : "bloqueada"}.
            </p>
            <p className="text-xs text-slate-400">La lectura autenticada no certifica permisos de escritura. Toda mutación sigue requiriendo Owner Gate y revisión. No se requiere Node Agent físico.</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-200" role="status">
            {integrationsLoading ? "Comprobando conexiones de runtime…" : "Estado no verificable. No se autoriza ingeniería AGI por este indicador."}
          </p>
        )}
      </section>

      {selectedId ? <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 p-3"><span className="break-all text-sm">Acción: {selectedId}</span><button type="button" disabled={loading || Boolean(busyId)} onClick={() => { setSelectedId(undefined); setPage(0); setView("needs_approval"); setActions([]); setLoading(true); }}>Ver todas</button></div> : null}
      <div className="hko-approval-metrics">
        <div><span>{view === "needs_approval" ? "Pendientes visibles" : "Vista actual"}</span><strong>{loadError || loading ? "—" : selectedId ? "Individual" : pendingCount ?? (view === "approved" ? "Aprobadas" : "Historial")}</strong></div>
        <div><span>Registros en página</span><strong>{loadError || loading ? "—" : actions.length}</strong></div>
        <div><span>Modo</span><strong>Owner Gate</strong></div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar acciones">
        {([
          ["needs_approval", "Por aprobar"],
          ["approved", "Aprobadas"],
          ["history", "Historial"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            disabled={loading || Boolean(busyId)}
            onClick={() => { if (key === view && !selectedId && page === 0) return; setSelectedId(undefined); setView(key); setPage(0); setActions([]); setLoading(true); setReviewId(null); setMessage(""); }}
            className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition ${view === key
              ? "border-sky-300/35 bg-sky-400/10 text-sky-100"
              : "border-white/10 text-slate-400 hover:bg-white/[0.05]"}`}
          >{label}</button>
        ))}
      </div>

      {message ? <p className="hko-approval-message" role="status">{message}</p> : null}

      <div className="hko-approval-list">
        {actions.length === 0 && !loading && !loadError ? (
          <article className="hko-approval-empty">
            <h3>{selectedId ? "Acción no disponible" : view === "needs_approval" ? "Sin pendientes en esta página" : "Sin registros en esta página"}</h3>
            <p>Cuando NOVA proponga cambios reales, aparecerán aquí con plan, riesgo y rollback.</p>
          </article>
        ) : null}

        {orderedActions.map((action) => {
          const plan = action.payload?.write_plan;
          const isPending = action.status === "needs_approval";
          const guidedReview = action.tool_key === "github" && action.payload?.materializer_version === "12.7K-2A" && ["github.create_branch", "github.upsert_file", "github.create_pr"].includes(action.action_type);
          const isApproved = action.status === "approved";
          const isBusy = loading || Boolean(busyId);

          return (
            <article key={action.id} id={"action-" + action.id} className="hko-approval-card">
              <div className="hko-approval-card-top">
                <div>
                  <p className="hko-approval-meta">{Number.isInteger(action.payload?.sequence_index) ? "Paso " + (Number(action.payload?.sequence_index) + 1) + " · " : ""}{action.agi_id} · {action.tool_key || "Acción"}</p>
                  <h3>{action.title}</h3>
                </div>
                <div className="hko-approval-badges">
                  <span data-status={action.status}>{statusLabel(action.status)}</span>
                  <span data-risk={action.risk_level}>{riskLabel(action.risk_level)}</span>
                </div>
              </div>

              <div className="hko-approval-grid">
                <div><span>Repositorio</span><strong>{plan?.repository || "No definido"}</strong></div>
                <div><span>Rama</span><strong>{plan?.target_branch || "No aplica"}</strong></div>
                <div><span>Archivo</span><strong>{plan?.path || "No aplica"}</strong></div>
              </div>

              <details className="mt-4 rounded-xl border border-slate-700 p-3">
                <summary className="cursor-pointer py-1 text-sm font-semibold text-sky-200">Detalles y evidencia</summary>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <p className="break-all">ID: {action.id}</p>
                  <p>Operación: {action.action_type}</p>
                  {action.payload?.expected_base_sha ? <p className="break-all">SHA de origen: {action.payload.expected_base_sha}</p> : null}
                  {action.payload?.expected_sha ? <p className="break-all">SHA del archivo: {action.payload.expected_sha}</p> : null}
                  {plan?.content_preview?.bytes ? <p>Contenido propuesto: {plan.content_preview.bytes} bytes · {plan.content_preview.lines ?? "—"} líneas</p> : null}
                  {plan?.steps?.length ? <ul className="list-disc space-y-1 pl-5">{plan.steps.map((step, index) => <li key={index}>{step}</li>)}</ul> : null}
                  {plan?.rollback_plan?.steps?.length ? <div><strong>Reversión</strong><ul className="list-disc space-y-1 pl-5">{plan.rollback_plan.steps.map((step, index) => <li key={index}>{step}</li>)}</ul></div> : null}
                  {plan?.next_step ? <p>{plan.next_step}</p> : null}
                </div>
              </details>
              {action.execution_error ? <p className="hko-approval-error">{action.execution_error}</p> : null}

              <div className="hko-approval-actions">
                {isPending ? <button type="button" disabled={isBusy || (previewReadOnly && !guidedReview)} onClick={() => guidedReview ? setInlineReviewId(action.id) : setReviewId(reviewId === action.id ? null : action.id)}>{previewReadOnly && guidedReview ? "Revisar acción" : "Revisar y aprobar"}</button> : null}
                {isPending && !previewReadOnly ? <button type="button" disabled={isBusy} onClick={() => void mutate("/api/agi/runtime/actions/decision", { action_id: action.id, decision: "reject", note: "Rechazado desde Owner Approval Center." })}>Rechazar</button> : null}
                {isApproved && !previewReadOnly ? <button type="button" disabled={isBusy} onClick={() => void mutate("/api/agi/runtime/actions/execute", { action_id: action.id })}>Ejecutar acción aprobada</button> : null}
              </div>
              {isPending && !previewReadOnly && reviewId === action.id ? <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/5 p-4"><p className="text-sm text-slate-100">Confirma solo después de revisar el alcance, riesgo y detalles. La aprobación requiere MFA y no ejecuta el cambio.</p><div className="hko-approval-actions"><button type="button" disabled={isBusy} onClick={() => void mutate("/api/agi/runtime/actions/decision", { action_id: action.id, decision: "approve", note: "Aprobado desde Owner Approval Center tras revisión explícita." })}>Confirmar aprobación</button><button type="button" disabled={isBusy} onClick={() => setReviewId(null)}>Volver</button></div></div> : null}
            </article>
          );
        })}
      </div>
      {previewReadOnly ? <p role="status" className="mt-3 text-sm text-slate-300">Vista de evaluación: las decisiones y ejecuciones están deshabilitadas.</p> : null}
      {inlineReviewId ? <OwnerInlineActionReview projectId={projectId} actionId={inlineReviewId} onClose={() => setInlineReviewId(null)} onApproved={() => void load()} /> : null}
      {!selectedId ? <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginación de acciones">
        <button type="button" disabled={loading || Boolean(busyId) || page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}
          className="min-h-11 rounded-xl border border-white/10 px-4 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-35">Anterior</button>
        <span className="text-xs text-slate-400">Página {page + 1} · {view === "needs_approval" ? "Pendientes" : view === "approved" ? "Aprobadas" : "Historial"}</span>
        <button type="button" disabled={loading || Boolean(busyId) || !hasNext} onClick={() => setPage((value) => value + 1)}
          className="min-h-11 rounded-xl border border-white/10 px-4 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-35">Siguiente</button>
      </nav> : null}
    </section>
  );
}
