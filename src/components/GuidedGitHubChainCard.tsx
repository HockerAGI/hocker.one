"use client";

import type { GuidedGitHubChain, RuntimeAction } from "./nova-chat-types";
import { BLOCKING_STATUSES, GUIDED_GITHUB_ACTION_ORDER } from "./nova-chat-types";
import {
  guidedGithubStepLabel,
  humanStatus,
  isGuidedGithubCompleted,
  statusTone,
  shortTechnicalValue,
  actionEvidenceText,
  actionRollbackText,
  actionPrimaryLocation,
} from "./nova-chat-helpers";
import { guidedGithubChainOutcome, percentComplete } from "@/lib/hocker-signal-state.mjs";

export function GuidedGitHubChainCard({ chain, busyAction, onShowSummary, onMutate }: { chain: GuidedGitHubChain; busyAction: string | null; onShowSummary: () => void; onMutate: (action: RuntimeAction, mode: "approve" | "reject" | "execute") => void }) {
  const nextAction = chain.nextAction;
  const loading = nextAction ? busyAction === nextAction.id : false;
  const canApprove = Boolean(nextAction && ["needs_approval", "ready_for_production", "production_ready", "queued", "dry_run_queued"].includes(nextAction.status));
  const canExecute = Boolean(nextAction && nextAction.status === "approved");
  const canReject = Boolean(nextAction && BLOCKING_STATUSES.has(nextAction.status));
  const nextLabel = nextAction ? guidedGithubStepLabel(nextAction.action_type) : "Flujo";
  const outcome = guidedGithubChainOutcome(chain.actions.map((action) => action.status), chain.total);
  const progress = percentComplete(chain.completed, chain.total);
  const headline = outcome === "completed"
    ? "Ejecución completada"
    : outcome === "cancelled"
      ? "Ejecución cancelada"
      : outcome === "failed"
        ? "Ejecución requiere revisión"
        : nextAction
          ? `Siguiente: ${nextLabel}`
          : "Ejecución en progreso";
  const outcomeStatus = outcome === "completed"
    ? "Completado"
    : outcome === "cancelled"
      ? "Cancelado"
      : outcome === "failed"
        ? "Requiere revisión"
        : nextAction
          ? humanStatus(nextAction.status)
          : "En progreso";
  const outcomeTone = outcome === "completed"
    ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
    : outcome === "cancelled" || outcome === "failed"
      ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
      : "border-amber-300/25 bg-amber-300/10 text-amber-100";

  return (
    <div className="rounded-[1.7rem] border border-sky-300/20 bg-[radial-gradient(circle_at_top_left,rgba(30,200,255,0.10),transparent_32%),rgba(255,255,255,0.045)] p-4 shadow-[0_0_38px_rgba(56,189,248,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Cambios en código</p>
          <h3 className="mt-1 text-base font-black text-white">{headline}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-300">NOVA prepara. Tú apruebas. El sistema ejecuta un paso a la vez con evidencia.</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${outcomeTone}`}>
          {chain.completed} de {chain.total} ejecutados · {progress}%
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-300">
          <b className="text-slate-100">Rama protegida:</b> {shortTechnicalValue(chain.targetBranch, 84)}
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-300">
          <b className="text-slate-100">Estado:</b> {outcomeStatus}
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {GUIDED_GITHUB_ACTION_ORDER.map((actionType, index) => {
          const action = chain.actions.find((item) => item.action_type === actionType);
          const active = Boolean(action && nextAction?.id === action.id);
          const done = Boolean(action && isGuidedGithubCompleted(action));

          return (
            <div key={actionType} className={`rounded-2xl border p-3 ${active ? "border-sky-300/30 bg-sky-300/10" : done ? "border-emerald-300/25 bg-emerald-300/10" : "border-white/10 bg-white/[0.035]"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-black text-sky-100">{index + 1}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${statusTone(action?.status ?? "pendiente")}`}>
                  {humanStatus(action?.status ?? "pendiente")}
                </span>
              </div>
              <p className="mt-2 text-sm font-black text-white">{guidedGithubStepLabel(actionType)}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-300">{action ? actionEvidenceText(action) : "Se activará cuando el paso anterior esté listo."}</p>
              {action ? (
                <details className="mt-2 rounded-xl border border-white/10 bg-slate-950/35 p-2">
                  <summary className="cursor-pointer list-none text-[11px] font-bold text-sky-100">Evidencia y reversa</summary>
                  <div className="mt-2 space-y-2 text-[11px] leading-5 text-slate-300">
                    <p><b className="text-slate-200">Dónde:</b> {shortTechnicalValue(actionPrimaryLocation(action), 88)}</p>
                    <p><b className="text-slate-200">Reversa:</b> {actionRollbackText(action)}</p>
                    <p className="text-slate-500">ID técnico: {action.id}</p>
                  </div>
                </details>
              ) : null}
              {action?.execution_error ? (
                <p className="mt-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-2 text-[11px] text-rose-100">{action.execution_error}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onShowSummary} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
          Ver estado
        </button>

        {nextAction && canApprove ? (
          <button type="button" disabled={loading} onClick={() => onMutate(nextAction, "approve")} className="min-h-10 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-50">
            {loading ? "Procesando…" : `Aprobar ${nextLabel}`}
          </button>
        ) : null}

        {nextAction && canExecute ? (
          <button type="button" disabled={loading} onClick={() => onMutate(nextAction, "execute")} className="min-h-10 rounded-xl bg-sky-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-sky-200 disabled:opacity-50">
            {loading ? "Ejecutando…" : `Ejecutar ${nextLabel}`}
          </button>
        ) : null}

        {nextAction && canReject ? (
          <button type="button" disabled={loading} onClick={() => onMutate(nextAction, "reject")} className="min-h-10 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-bold text-rose-100 hover:bg-rose-300/15 disabled:opacity-50">
            Cancelar flujo
          </button>
        ) : null}

        {outcome === "completed" ? (
          <span className="min-h-10 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100">
            Cadena completada
          </span>
        ) : null}
        {outcome === "cancelled" ? (
          <span className="min-h-10 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-black text-rose-100">
            Ejecución cancelada
          </span>
        ) : null}
      </div>
    </div>
  );
}
