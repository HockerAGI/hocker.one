"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

  const pendingCount = useMemo(() => actions.filter((item) => item.status === "needs_approval").length, [actions]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/agi/runtime/actions?project_id=${encodeURIComponent(projectId)}&limit=20`, { cache: "no-store" });
      const data = (await res.json()) as ApiListResponse;
      if (!res.ok || data.error) throw new Error(data.error || "No se pudo leer la cola AGI.");
      setActions(data.actions ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo leer la cola AGI.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

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
      setMessage(data.message || "Operación completada.");
      await load();
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

      <div className="hko-approval-metrics">
        <div><span>Pendientes</span><strong>{pendingCount}</strong></div>
        <div><span>Total cola</span><strong>{actions.length}</strong></div>
        <div><span>Modo</span><strong>Owner Gate</strong></div>
      </div>

      {message ? <p className="hko-approval-message">{message}</p> : null}

      <div className="hko-approval-list">
        {actions.length === 0 && !loading ? (
          <article className="hko-approval-empty">
            <h3>Sin acciones pendientes</h3>
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
    </section>
  );
}
