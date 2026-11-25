"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

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

function riskLabel(risk: string) {
  const labels: Record<string, string> = { low: "Bajo", medium: "Medio", high: "Alto", critical: "Crítico" };
  return labels[risk] ?? risk;
}

export default function OwnerUnifiedApprovals({ projectId, enabled = true, preview = false, initialPendingCount = null }: { projectId: string; enabled?: boolean; preview?: boolean; initialPendingCount?: number | null }) {
  const [actions, setActions] = useState<RuntimeAction[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [loadError, setLoadError] = useState(false);

  const pending = useMemo(() => actions.filter((a) => a.status === "needs_approval"), [actions]);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch(`/api/agi/runtime/actions?project_id=${encodeURIComponent(projectId)}&status=needs_approval&limit=10`, { cache: "no-store" });
      const data = (await res.json()) as ApiListResponse;
      if (!res.ok || data.ok !== true || !Array.isArray(data.actions)) throw new Error(data.error || "No se pudo consultar la cola.");
      setLoadError(false);
      setActions(data.actions ?? []);
    } catch {
      setLoadError(true);
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => { void load(); }, 0);
    const interval = setInterval(() => { void load(); }, 30000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, [load, enabled]);


  return (
    <section className="hko-uni-panel hko-uni-appr">
      <div className="hko-uni-panel-head">
        <div>
          <p className="hko-uni-panel-kicker">Aprobaciones</p>
          <p className="hko-uni-panel-title">{!enabled ? "Consulta protegida" : loading || loadError ? initialPendingCount !== null ? `${initialPendingCount} por aprobar · última consulta` : "Pendientes por verificar" : `${pending.length === 10 ? "10+" : pending.length} por aprobar`}</p>
        </div>
        <span className={`hko-status-val ${!enabled || loading || loadError || pending.length > 0 ? "warn" : "ok"}`}>
          {!enabled ? preview ? "Producción" : "MFA" : loading ? "Consultando" : loadError ? "Sin verificar" : pending.length > 0 ? "Revisar" : "Sin pendientes"}
        </span>
      </div>
      <div className="hko-uni-panel-body">
        {!enabled ? <p className="text-sm leading-6 text-slate-300">{preview ? "La cola real se consulta en Producción; Preview no tiene acceso a los registros protegidos." : "Verifica tu sesión Owner con MFA para consultar la cola."}</p> : loading ? (
          <p className="hko-uni-appr-empty">Leyendo cola…</p>
        ) : loadError ? (
          <p className="hko-uni-appr-empty text-amber-200" role="status">
            No fue posible consultar la cola. Revisa el centro Owner antes de asumir que no hay pendientes.
          </p>
        ) : pending.length === 0 ? (
          <p className="hko-uni-appr-empty">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-300/60" />
            Sin acciones pendientes de aprobación.
          </p>
        ) : (
          pending.slice(0, 3).map((action) => (
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
                <Link href={"/owner/actions?action_id=" + encodeURIComponent(action.id)} className="hko-uni-appr-btn approve inline-flex min-h-11 items-center justify-center">
                  Revisar acción
                </Link>
              </div>
            </div>
          ))
        )}
        {preview ? <a href="https://hockerone.vercel.app/owner/actions" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-sky-200">Abrir aprobaciones en Producción</a> : !enabled ? <Link href="/auth/mfa?returnTo=%2Fowner" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-sky-200">Verificar acceso</Link> : <Link href="/owner/actions" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-sky-200">Ver todas las acciones</Link>}
      </div>
    </section>
  );
}
