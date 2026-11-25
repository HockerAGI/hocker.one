"use client";

import Link from "next/link";
import { useState } from "react";
import { Wand2 } from "lucide-react";
import type { ChatActionDraft, RuntimeAction } from "./nova-chat-types";
import { compact, formatScope, humanRisk, humanStatus, humanTool, statusTone, summarizeAction } from "./nova-chat-helpers";

export function DraftCard({ draft, action, queueVerified, refreshing, onShowSummary, onCancel }: {
  draft: ChatActionDraft;
  action?: RuntimeAction;
  queueVerified: boolean;
  refreshing: boolean;
  onShowSummary: () => void;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = typeof draft.id === "string" && draft.id.length > 0 ? draft.id : null;
  const persisted = Boolean(id || draft.enqueued === true);
  const live = queueVerified && action && action.id === id ? action : undefined;
  const canCancelLocally = !persisted && draft.enqueued === false && draft.executed === false;
  const required = live ? live.requires_approval : persisted ? undefined : draft.draft?.owner_gate_required;
  const status = live ? humanStatus(live.status) : persisted ? "Estado sin verificar" : canCancelLocally ? "Borrador" : "Estado sin verificar";
  const info = live ? summarizeAction(live) : null;
  const flow = Array.isArray(draft.draft?.proposed_flow) ? draft.draft.proposed_flow : [];
  const href = id ? "/owner/actions?action_id=" + encodeURIComponent(id) : "/owner/actions";
  const title = live?.title || draft.title || draft.draft?.title || "Acción propuesta";

  return (
    <article className="mt-3 rounded-2xl border border-slate-700/70 bg-[#101a29] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-300/10 text-sky-200"><Wand2 className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <h3 className="break-words text-base font-semibold text-white">{compact(title, 180)}</h3>
            <p className="mt-1 text-sm text-slate-300">{humanTool(live?.tool_key ?? draft.tool_key)} · {(live?.risk_level ?? draft.risk_level) ? humanRisk(live?.risk_level ?? draft.risk_level) : "Riesgo sin verificar"}</p>
          </div>
        </div>
        <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusTone(live?.status ?? "unknown")}`}>{status}</span>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-xl border border-white/10 p-3 text-slate-300">Aprobación: <strong className="text-white">{required === true ? "Requerida" : required === false ? "No requerida" : "Por verificar"}</strong></p>
        <p className="rounded-xl border border-white/10 p-3 text-slate-300">{persisted ? live ? "Registrada en la cola" : "Registro por verificar" : formatScope(draft.scope)}</p>
      </div>
      {info ? <p className="mt-3 break-all text-sm text-slate-300">{info.repo}{info.branch !== "No aplica" ? " · " + info.branch : ""}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" aria-expanded={expanded} onClick={() => { setExpanded(value => !value); if (!expanded && persisted) onShowSummary(); }} className="min-h-11 rounded-xl border border-slate-600 px-4 text-sm font-medium text-slate-100 hover:bg-white/5">{expanded ? "Ocultar estado" : "Ver estado"}</button>
        {persisted ? <Link href={href} className="inline-flex min-h-11 items-center rounded-xl bg-sky-300 px-4 text-sm font-semibold text-slate-950 hover:bg-sky-200">{live?.status === "needs_approval" ? "Revisar y aprobar" : "Abrir acción"}</Link> : null}
        {canCancelLocally ? <button type="button" disabled={!canCancelLocally} onClick={onCancel} className="min-h-11 rounded-xl border border-rose-300/25 px-4 text-sm text-rose-200">Descartar borrador</button> : null}
      </div>
      {expanded ? <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm text-slate-300" role="status">
        <p>{refreshing && persisted ? "Consultando estado…" : status}</p>
        {id ? <p className="break-all">ID: {id}</p> : null}
        {info ? <><p className="break-all">Repositorio: {info.repo}</p><p className="break-all">Rama: {info.branch}</p><p className="break-all">Archivo: {info.path}</p></> : null}
        {live?.execution_error ? <p className="text-rose-200">{live.execution_error}</p> : null}
        {flow.length ? <ol className="list-decimal space-y-1 pl-5">{flow.map((item, index) => <li key={index}>{item}</li>)}</ol> : null}
        {persisted ? <p>Para rechazar una acción registrada, usa el centro de aprobaciones (Owner Gate).</p> : null}
        {persisted && !live && !refreshing ? <p>Abre la acción para consultar el registro exacto. No se ha confirmado su estado desde esta vista.</p> : null}
        {!persisted ? <p>{draft.next_step || draft.reason || "Revisa la propuesta antes de continuar."}</p> : null}
      </div> : null}
    </article>
  );
}
