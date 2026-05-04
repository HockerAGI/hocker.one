"use client";

import { useState } from "react";
import type { ChidoActionContract } from "@/lib/chido-actions";

type Props = {
  actions: ChidoActionContract[];
};

type Result = {
  ok?: boolean;
  dry_run?: boolean;
  executed?: boolean;
  approval_request_id?: string;
  event_id?: string;
  status?: string;
  error?: string;
  message?: string;
};

export default function ApprovalRequestPanel({ actions }: Props) {
  const [action, setAction] = useState(actions[0]?.id ?? "");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [requestedBy, setRequestedBy] = useState("hocker-one-ui");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/chido/actions/approval/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          target_id: targetId,
          reason,
          requested_by: requestedBy,
        }),
      });

      const json = (await res.json()) as Result;
      setResult(json);
    } catch (error) {
      setResult({
        ok: false,
        dry_run: true,
        executed: false,
        error: error instanceof Error ? error.message : "Error desconocido.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="hocker-panel-pro p-5">
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Approval Layer</p>
        <h2 className="mt-1 text-xl font-black text-white">Crear solicitud de aprobación</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Esto no ejecuta acciones reales. Solo crea una solicitud auditada para revisión de guardianes.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Acción</span>
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none"
          >
            {actions.map((item) => (
              <option key={item.id} value={item.id} className="bg-slate-950 text-white">
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">ID objetivo</span>
          <input
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            placeholder="solicitud / usuario / movimiento"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Solicitado por</span>
          <input
            value={requestedBy}
            onChange={(event) => setRequestedBy(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Razón</span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="motivo de la revisión"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading || !action}
        className="mt-5 hocker-button-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creando solicitud..." : "Crear solicitud"}
      </button>

      {result ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className={result.ok ? "text-sm font-black text-emerald-300" : "text-sm font-black text-rose-300"}>
            {result.ok ? "Solicitud creada" : "Solicitud rechazada"}
          </p>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
