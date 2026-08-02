"use client";

import { Wand2 } from "lucide-react";
import type { ChatActionDraft } from "./nova-chat-types";
import { compact, formatScope, humanRisk, humanTool } from "./nova-chat-helpers";

export function DraftCard({ draft, onShowSummary, onCancel }: { draft: ChatActionDraft; onShowSummary: () => void; onCancel: () => void }) {
  const flow = Array.isArray(draft.draft?.proposed_flow) ? draft.draft?.proposed_flow ?? [] : [];
  const safe = draft.executed === false && draft.enqueued === false;
  const canCancelLocally = draft.enqueued !== true;

  return (
    <div className="mt-3 overflow-hidden rounded-[1.6rem] border border-sky-300/20 bg-[radial-gradient(circle_at_top_left,rgba(30,200,255,0.10),transparent_34%),rgba(255,255,255,0.045)] shadow-[0_18px_64px_rgba(14,165,233,0.10)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sky-300/10 text-sky-200">
            <Wand2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-black text-white">NOVA preparó una acción</p>
            <p className="text-[11px] text-slate-400">{formatScope(draft.scope)} · requiere tu revisión</p>
          </div>
        </div>

        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${safe ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-amber-300/30 bg-amber-300/10 text-amber-100"}`}>
          {safe ? "Sin ejecutar" : "Esperando aprobación"}
        </span>
      </div>

      <div className="space-y-3 px-4 py-4">
        <p className="text-sm leading-6 text-slate-100">{compact(draft.draft?.title || draft.reason || "NOVA preparó un borrador seguro.")}</p>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Tipo</p>
            <p className="mt-1 text-sm font-bold text-white">{humanTool(draft.tool_key)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Cuidado</p>
            <p className="mt-1 text-sm font-bold text-white">{humanRisk(draft.risk_level)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Tu aprobación</p>
            <p className="mt-1 text-sm font-bold text-white">{draft.draft?.owner_gate_required ? "Requerida" : "No requerida"}</p>
          </div>
        </div>

        {flow.length > 0 ? (
          <details className="group rounded-2xl border border-white/10 bg-slate-950/32 p-3">
            <summary className="cursor-pointer list-none text-xs font-black text-sky-100 outline-none transition hover:text-white">
              Ver detalle del plan
            </summary>
            <div className="mt-3 space-y-2">
              {flow.map((item, index) => (
                <div key={`${item}-${index}`} className="flex gap-2 text-xs text-slate-300">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-black text-sky-200">{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onShowSummary} className="min-h-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
            Ver estado
          </button>
          <button type="button" disabled className="min-h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-500">
            Requiere materialización segura
          </button>
          <button
            type="button"
            onClick={canCancelLocally ? onCancel : undefined}
            disabled={!canCancelLocally}
            title={canCancelLocally ? "Descartar este preview local" : "Estas acciones ya existen en la cola y deben rechazarse desde Owner Gate"}
            className="min-h-10 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-bold text-rose-100 hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-slate-500"
          >
            {canCancelLocally ? "Cancelar preview" : "Rechazar en Owner Gate"}
          </button>
        </div>
      </div>
    </div>
  );
}
