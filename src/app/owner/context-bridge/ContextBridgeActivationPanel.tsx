"use client";

import { useState } from "react";

type ActivationResponse = {
  ok?: boolean;
  error?: string;
  trace_id?: string;
  owner_gate_approval_id?: string | null;
  result?: {
    complete?: boolean;
    coverage?: Array<{ domain_key?: string; status?: string }>;
  };
};

const REQUIRED_PROVIDERS = [
  "chatgpt",
  "codex",
  "github",
  "google_drive",
  "supabase",
  "vercel",
] as const;

export default function ContextBridgeActivationPanel() {
  const [title, setTitle] = useState("Context Bridge · actualización aprobada");
  const [summary, setSummary] = useState(
    "Snapshot generado desde checkpoints verificados y activado por Owner con MFA AAL2.",
  );
  const [maxStalenessHours, setMaxStalenessHours] = useState("168");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActivationResponse | null>(null);

  async function activate() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/context-bridge/manifests/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: "hocker-one",
          scope: "global",
          title,
          summary,
          required_providers: REQUIRED_PROVIDERS,
          canonical_refs: [],
          max_staleness_hours: Number(maxStalenessHours),
          activate: true,
        }),
      });
      const payload = (await response.json()) as ActivationResponse;
      setResult(payload);
      if (response.ok && payload.ok) {
        window.setTimeout(() => window.location.reload(), 900);
      }
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "No fue posible activar Context Bridge.",
      });
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = title.trim().length > 0
    && summary.trim().length > 0
    && Number.isInteger(Number(maxStalenessHours))
    && Number(maxStalenessHours) >= 1
    && Number(maxStalenessHours) <= 720;

  return (
    <section className="hocker-panel-pro p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-300">
        Owner Gate · AAL2
      </p>
      <h2 className="mt-2 text-xl font-black text-white">Crear y activar un snapshot verificado</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        Esta acción crea un manifiesto con los checkpoints más recientes. Solo se activa si los seis
        proveedores requeridos tienen cobertura completa y la sesión actual sigue en AAL2.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Título</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={240}
            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Resumen</span>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            maxLength={4000}
            rows={4}
            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
          />
        </label>

        <label className="grid max-w-xs gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Máxima antigüedad de checkpoints (horas)
          </span>
          <input
            type="number"
            min={1}
            max={720}
            step={1}
            value={maxStalenessHours}
            onChange={(event) => setMaxStalenessHours(event.target.value)}
            className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
          />
        </label>
      </div>

      <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.025] p-4 text-xs leading-5 text-slate-400">
        Proveedores obligatorios: ChatGPT, Codex, GitHub, Google Drive, Supabase y Vercel. La ruta
        legacy por llave solo puede crear drafts; no puede activar manifiestos.
      </div>

      {result ? (
        <div
          className={`mt-4 rounded-xl border p-4 text-sm ${
            result.ok
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/20 bg-rose-500/10 text-rose-200"
          }`}
        >
          <p className="font-bold">
            {result.ok ? "Activación registrada." : result.error ?? "Activación bloqueada."}
          </p>
          {result.owner_gate_approval_id ? (
            <p className="mt-1 text-xs opacity-80">Approval: {result.owner_gate_approval_id}</p>
          ) : null}
          {result.trace_id ? <p className="mt-1 text-xs opacity-80">Trace: {result.trace_id}</p> : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={activate}
        disabled={!canSubmit || loading}
        className="hocker-button-primary mt-5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Verificando y activando…" : "Crear y activar con MFA"}
      </button>
    </section>
  );
}
