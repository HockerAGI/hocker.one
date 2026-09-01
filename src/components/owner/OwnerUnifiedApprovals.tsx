"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

type RuntimeAction = {
  id: string;
  agi_id: string;
  tool_key: string | null;
  action_type: string;
  title: string;
  status: string;
  risk_level: string;
};

type ApiListResponse = { ok?: boolean; actions?: RuntimeAction[]; error?: string };
type MutateResponse = { ok?: boolean; item?: RuntimeAction; error?: string; message?: string };

const OPERATIONAL_REFRESH_EVENT = "hocker:operational-refresh";

function riskLabel(risk: string) {
  const labels: Record<string, string> = { low: "Bajo", medium: "Medio", high: "Alto", critical: "Crítico" };
  return labels[risk] ?? risk;
}

export default function OwnerUnifiedApprovals({ projectId }: { projectId: string }) {
  const [actions, setActions] = useState<RuntimeAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = useMemo(() => actions.filter((a) => a.status === "needs_approval"), [actions]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/agi/runtime/actions?project_id=${encodeURIComponent(projectId)}&limit=10`, { cache: "no-store" });
      const data = (await res.json()) as ApiListResponse;
      if (!res.ok || data.error) throw new Error(data.error);
      setActions(data.actions ?? []);
    } catch {
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => { void load(); }, 30_000);
    const onOperationalRefresh = () => { void load(); };
    window.addEventListener(OPERATIONAL_REFRESH_EVENT, onOperationalRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener(OPERATIONAL_REFRESH_EVENT, onOperationalRefresh);
    };
  }, [load]);

  async function mutate(actionId: string, decision: "approve" | "reject") {
    setBusyId(actionId);
    try {
      const res = await fetch("/api/agi/runtime/actions/decision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: projectId, action_id: actionId, decision, note: "Decisión desde panel unificado." }),
      });
      const data = (await res.json()) as MutateResponse;
      if (!res.ok || data.error) throw new Error(data.error);
      await load();
    } catch {
      /* Server policy remains authoritative; refresh will reconcile the view. */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="hko-uni-panel hko-uni-appr">
      <div className="hko-uni-panel-head">
        <div>
          <p className="hko-uni-panel-kicker">Aprobaciones</p>
          <p className="hko-uni-panel-title">Cola AGI · {pending.length} pendientes</p>
        </div>
        <span className={`hko-status-val ${pending.length > 0 ? "warn" : "ok"}`}>
          {pending.length > 0 ? "Revisar" : "Limpia"}
        </span>
      </div>
      <div className="hko-uni-panel-body">
        {loading ? (
          <p className="hko-uni-appr-empty">Leyendo cola…</p>
        ) : pending.length === 0 ? (
          <p className="hko-uni-appr-empty">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-300/60" />
            Sin acciones pendientes. Todo en orden.
          </p>
        ) : (
          pending.map((action) => (
            <div key={action.id} className="hko-uni-appr-item">
              <div className="hko-uni-appr-top">
                <div style={{ minWidth: 0 }}>
                  <p className="hko-uni-appr-title">{action.title}</p>
                  <p className="hko-uni-appr-meta">{action.agi_id} · {action.tool_key ?? "tool"} · {action.action_type}</p>
                </div>
                <div className="hko-uni-appr-badges">
                  <span className="hko-uni-appr-badge" style={{ background: "rgba(251,191,36,0.12)", color: "rgb(254,240,138)", border: "1px solid rgba(251,191,36,0.2)" }}>Pendiente</span>
                  <span className="hko-uni-appr-badge" style={{ background: "rgba(244,63,94,0.1)", color: "rgb(254,205,211)", border: "1px solid rgba(244,63,94,0.18)" }}>{riskLabel(action.risk_level)}</span>
                </div>
              </div>
              <div className="hko-uni-appr-btns">
                <button type="button" className="hko-uni-appr-btn approve" disabled={busyId === action.id} onClick={() => void mutate(action.id, "approve")}>
                  <CheckCircle2 className="mr-1 inline h-3 w-3" /> Aprobar
                </button>
                <button type="button" className="hko-uni-appr-btn reject" disabled={busyId === action.id} onClick={() => void mutate(action.id, "reject")}>
                  <XCircle className="mr-1 inline h-3 w-3" /> Rechazar
                </button>
              </div>
            </div>
          ))
        )}
        {!loading && pending.length === 0 && actions.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.68rem", color: "rgba(100,116,139,1)", marginTop: "0.3rem" }}>
            <Clock3 className="h-3 w-3" /> {actions.length} acciones en historial
          </div>
        )}
      </div>
    </section>
  );
}
