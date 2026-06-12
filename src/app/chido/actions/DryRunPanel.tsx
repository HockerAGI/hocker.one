"use client";

import { useMemo, useState } from "react";
import type { ChidoActionContract } from "@/lib/chido-actions";

type Props = {
  actions: ChidoActionContract[];
};

type DryRunResult = {
  ok?: boolean;
  dry_run?: boolean;
  executed?: boolean;
  event_id?: string;
  trace_id?: string;
  error?: string;
  message?: string;
};

export default function DryRunPanel({ actions }: Props) {
  const [action, setAction] = useState(actions[0]?.id ?? "");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DryRunResult | null>(null);

  const selected = useMemo(() => actions.find((item) => item.id === action), [actions, action]);

  async function submit() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/chido/actions/dry-run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          target_id: targetId,
          reason,
          requested_by: "hocker-one-ui",
        }),
      });

      const json = (await res.json()) as DryRunResult;
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
      <div className="flex flex-col gap-2">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Dry-run</p>
        <h2 className="text-xl font-black text-white">Simular intención controlada</h2>
        <p className="text-sm leading-6 text-slate-400">
          Esta prueba solo registra auditoría. No aprueba, rechaza, paga, retira, modifica balances ni ejecuta apuestas.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
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
            placeholder="id redactado / solicitud / usuario"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Razón</span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="motivo de la simulación"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-slate-600"
          />
        </label>
      </div>

      {selected ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{selected.riskLevel}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{selected.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.guardianAgis.map((agi) => (
              <span key={agi} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                {agi}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={loading || !action}
        className="mt-5 hocker-button-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Registrando dry-run..." : "Registrar dry-run"}
      </button>

      {result ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className={result.ok ? "text-sm font-black text-emerald-300" : "text-sm font-black text-rose-300"}>
            {result.ok ? "Dry-run registrado" : "Dry-run rechazado"}
          </p>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
