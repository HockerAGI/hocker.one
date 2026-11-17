"use client";

import { useCallback, useEffect, useState } from "react";

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
    write_plan?: {
      operation?: string;
      repository?: string;
      target_branch?: string;
      path?: string | null;
      title?: string | null;
      risk_level?: string;
      next_step?: string;
    };
  };
};

type ApiListResponse = { ok?: boolean; actions?: RuntimeAction[]; error?: string };
type MutateResponse = { ok?: boolean; item?: RuntimeAction; error?: string; message?: string };

type IntegrationProbe = { configured: boolean; verified_read: boolean; state: "missing" | "verification_failed" | "verified_read" };
type EngineeringIntegrations = {
  ok: true;
  checked_at: string;
  github: IntegrationProbe;
  vercel: IntegrationProbe;
  node_agent_required: false;
  owner_gate_required_for_writes: true;
  github_write_scope_verified: false;
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

export default function OwnerApprovalCenter({ projectId }: { projectId: string }) {
  const [actions, setActions] = useState<RuntimeAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [view, setView] = useState<ActionView>("needs_approval");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [integrations, setIntegrations] = useState<EngineeringIntegrations | null>(null);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);

  const pendingCount = view === "needs_approval" ? actions.length : null;

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
    queueMicrotask(() => setLoading(true));
    try {
      // Fetch the selected status before pagination. A pending approval must
      // never be hidden behind more recent closed actions.
      const params = new URLSearchParams({
        project_id: projectId,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (view !== "history") params.set("status", view);
      const res = await fetch(`/api/agi/runtime/actions?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as ApiListResponse;
      if (!res.ok || data.ok !== true || !Array.isArray(data.actions)) {
        throw new Error(data.error || "No se pudo leer la cola AGI.");
      }
      setActions(data.actions);
      setHasNext(data.actions.length === PAGE_SIZE);
      setLoadError(false);
    } catch (error) {
      setActions([]);
      setHasNext(false);
      setLoadError(true);
      setMessage(error instanceof Error ? error.message : "No se pudo leer la cola AGI.");
    } finally {
      setLoading(false);
    }
  }, [projectId, view, page]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function mutate(path: string, payload: Record<string, unknown>) {
    setBusyId(String(payload.action_id ?? ""));
    setMessage("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: projectId, ...payload }),
      });
      const data = (await res.json()) as MutateResponse;
      if (!res.ok || data.error) throw new Error(data.error || "Operación no completada.");
      await load();
      setMessage(data.message || "Operación completada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Operación no completada.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="hko-approval-shell">
      <div className="hko-approval-head">
        <div>
          <p className="hko-kicker">OWNER GATE · EJECUCIÓN CONTROLADA</p>
          <h2>Centro de aprobación AGI</h2>
          <p>NOVA y las AGIs dejan planes reales en cola. Tú apruebas, rechazas o ejecutas sin copiar comandos manuales.</p>
        </div>
        <button type="button" onClick={() => void load()} className="hko-approval-refresh" disabled={loading}>
          {loading ? "Leyendo..." : "Actualizar"}
        </button>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4" aria-label="Preparación de integraciones de ingeniería AGI">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Ingeniería AGI sin nodo físico</h3>
            <p className="mt-1 text-xs text-slate-400">Identidades de ejecución configuradas en Hocker One Production, verificadas mediante lectura autenticada.</p>
          </div>
          <button type="button" className="min-h-10 rounded-xl border border-white/15 px-3 text-xs text-slate-200 disabled:opacity-50"
            onClick={() => void checkIntegrations()} disabled={integrationsLoading}>
            {integrationsLoading ? "Verificando…" : "Verificar conexiones"}
          </button>
        </div>
        {integrations ? (
          <div className="mt-3 space-y-2 text-sm text-slate-200" role="status">
            <p>GitHub: {integrations.github.state === "verified_read" ? "lectura autenticada verificada" :
              integrations.github.state === "missing" ? "sin identidad de runtime en Production" : "conexión sin verificar"}</p>
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

      <div className="hko-approval-metrics">
        <div><span>{view === "needs_approval" ? "Pendientes visibles" : "Vista actual"}</span><strong>{pendingCount ?? (view === "approved" ? "Aprobadas" : "Historial")}</strong></div>
        <div><span>Registros en página</span><strong>{actions.length}</strong></div>
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
            disabled={loading}
            onClick={() => { setView(key); setPage(0); setMessage(""); }}
            className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition ${view === key
              ? "border-sky-300/35 bg-sky-400/10 text-sky-100"
              : "border-white/10 text-slate-400 hover:bg-white/[0.05]"}`}
          >{label}</button>
        ))}
      </div>

      {message ? <p className="hko-approval-message">{message}</p> : null}

      <div className="hko-approval-list">
        {actions.length === 0 && !loading && !loadError ? (
          <article className="hko-approval-empty">
            <h3>{view === "needs_approval" ? "Sin aprobaciones en esta página" : "Sin registros en esta página"}</h3>
            <p>Cuando NOVA proponga cambios reales, aparecerán aquí con plan, riesgo y rollback.</p>
          </article>
        ) : null}

        {actions.map((action) => {
          const plan = action.payload?.write_plan;
          const isPending = action.status === "needs_approval";
          const isApproved = action.status === "approved";
          const isBusy = busyId === action.id;

          return (
            <article key={action.id} className="hko-approval-card">
              <div className="hko-approval-card-top">
                <div>
                  <p className="hko-approval-meta">{action.agi_id} · {action.tool_key || "tool"} · {action.action_type}</p>
                  <h3>{action.title}</h3>
                </div>
                <div className="hko-approval-badges">
                  <span data-status={action.status}>{statusLabel(action.status)}</span>
                  <span data-risk={action.risk_level}>{riskLabel(action.risk_level)}</span>
                </div>
              </div>

              <div className="hko-approval-grid">
                <div><span>Repo</span><strong>{plan?.repository || "No definido"}</strong></div>
                <div><span>Rama</span><strong>{plan?.target_branch || "No aplica"}</strong></div>
                <div><span>Path</span><strong>{plan?.path || "No aplica"}</strong></div>
              </div>

              {plan?.next_step ? <p className="hko-approval-next">{plan.next_step}</p> : null}
              {action.execution_error ? <p className="hko-approval-error">{action.execution_error}</p> : null}

              <div className="hko-approval-actions">
                <button type="button" disabled={!isPending || isBusy} onClick={() => void mutate("/api/agi/runtime/actions/decision", { action_id: action.id, decision: "approve", note: "Aprobado desde Owner Approval Center." })}>Aprobar</button>
                <button type="button" disabled={!isPending || isBusy} onClick={() => void mutate("/api/agi/runtime/actions/decision", { action_id: action.id, decision: "reject", note: "Rechazado desde Owner Approval Center." })}>Rechazar</button>
                <button type="button" disabled={!isApproved || isBusy} onClick={() => void mutate("/api/agi/runtime/actions/execute", { action_id: action.id })}>Ejecutar aprobada</button>
              </div>
            </article>
          );
        })}
      </div>
      <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginación de acciones">
        <button type="button" disabled={loading || page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}
          className="min-h-11 rounded-xl border border-white/10 px-4 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-35">Anterior</button>
        <span className="text-xs text-slate-400">Página {page + 1} · {view === "needs_approval" ? "Pendientes" : view === "approved" ? "Aprobadas" : "Historial"}</span>
        <button type="button" disabled={loading || !hasNext} onClick={() => setPage((value) => value + 1)}
          className="min-h-11 rounded-xl border border-white/10 px-4 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-35">Siguiente</button>
      </nav>
    </section>
  );
}
