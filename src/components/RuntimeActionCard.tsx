"use client";

import type { RuntimeAction } from "./nova-chat-types";
import { BLOCKING_STATUSES } from "./nova-chat-types";
import {
  humanTool,
  guidedGithubStepLabel,
  humanStatus,
  statusTone,
  summarizeAction,
  shortTechnicalValue,
  actionEvidenceText,
  actionRollbackText,
} from "./nova-chat-helpers";

export function RuntimeActionCard({ action, busyAction, onShowSummary, onMutate }: { action: RuntimeAction; busyAction: string | null; onShowSummary: () => void; onMutate: (action: RuntimeAction, mode: "approve" | "reject" | "execute") => void }) {
  const info = summarizeAction(action);
  const loading = busyAction === action.id;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/48 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{action.title}</p>
          <p className="mt-1 text-xs text-slate-400">{humanTool(action.tool_key)} · {guidedGithubStepLabel(action.action_type)}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone(action.status)}`}>
          {humanStatus(action.status)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-xl bg-white/[0.04] p-2 text-slate-300"><b className="text-slate-100">Repositorio:</b> {info.repo}</div>
        <div className="rounded-xl bg-white/[0.04] p-2 text-slate-300"><b className="text-slate-100">Rama:</b> {shortTechnicalValue(info.branch, 54)}</div>
        <div className="rounded-xl bg-white/[0.04] p-2 text-slate-300"><b className="text-slate-100">Evidencia:</b> {shortTechnicalValue(info.path, 54)}</div>
      </div>

      <details className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <summary className="cursor-pointer list-none text-xs font-black text-sky-100">Ver evidencia y reversa</summary>
        <div className="mt-2 space-y-2 text-xs leading-5 text-slate-400">
          <p>{actionEvidenceText(action)}</p>
          <p><b className="text-slate-200">Reversa:</b> {actionRollbackText(action)}</p>
          <p className="text-slate-500">ID técnico: {action.id}</p>
        </div>
      </details>

      {action.execution_error ? (
        <p className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-xs text-rose-100">{action.execution_error}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onShowSummary} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
          Ver estado
        </button>

        {(action.status === "needs_approval" || action.status === "ready_for_production" || action.status === "production_ready") ? (
          <button type="button" disabled={loading} onClick={() => onMutate(action, "approve")} className="min-h-10 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-50">
            {loading ? "Procesando…" : "Aprobar cambio"}
          </button>
        ) : null}

        {action.status === "approved" ? (
          <button type="button" disabled={loading} onClick={() => onMutate(action, "execute")} className="min-h-10 rounded-xl bg-sky-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-sky-200 disabled:opacity-50">
            {loading ? "Ejecutando…" : "Ejecutar paso autorizado"}
          </button>
        ) : null}

        {BLOCKING_STATUSES.has(action.status) ? (
          <button type="button" disabled={loading} onClick={() => onMutate(action, "reject")} className="min-h-10 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-bold text-rose-100 hover:bg-rose-300/15 disabled:opacity-50">
            Cancelar flujo
          </button>
        ) : null}
      </div>
    </div>
  );
}
