"use client";

import { useState } from "react";
import { deriveProviderCoverageStatus } from "@/lib/context-bridge-coverage";
import type { ContextBridgeCurrentProof } from "@/lib/context-bridge";

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

type CurrentProofs = {
  observedAt: string;
  providers: ContextBridgeCurrentProof[];
} | null;

const PROVIDER_LABELS: Record<(typeof REQUIRED_PROVIDERS)[number], string> = {
  chatgpt: "ChatGPT",
  codex: "Codex",
  github: "GitHub",
  google_drive: "Google Drive",
  supabase: "Supabase",
  vercel: "Vercel",
};

const STATUS_LABELS: Record<string, string> = {
  complete: "Vigente",
  stale: "Vencido",
  missing: "Sin evidencia",
  partial: "Incompleto",
  blocked: "Bloqueado",
};

export default function ContextBridgeActivationPanel({ currentProofs }: { currentProofs: CurrentProofs }) {
  const [title, setTitle] = useState("Context Bridge · actualización aprobada");
  const [summary, setSummary] = useState(
    "Snapshot generado desde checkpoints verificados y activado por Owner con MFA AAL2.",
  );
  const [maxStalenessHours, setMaxStalenessHours] = useState("168");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActivationResponse | null>(null);

  const freshnessHours = Number(maxStalenessHours);
  const checkedAtMs = Date.parse(currentProofs?.observedAt ?? "");
  const providerReadiness = currentProofs && Number.isFinite(checkedAtMs)
    ? currentProofs.providers.map((proof) => ({
        ...proof,
        status: deriveProviderCoverageStatus({
          checkpointObservedAt: proof.checkpointObservedAt,
          staleBefore: checkedAtMs - freshnessHours * 60 * 60 * 1000,
          capabilities: proof.capabilities,
        }),
      }))
    : [];
  const currentCoverageComplete = providerReadiness.length === REQUIRED_PROVIDERS.length
    && REQUIRED_PROVIDERS.every((provider) =>
      providerReadiness.some((proof) => proof.provider === provider && proof.status === "complete"),
    );
  const completeProviders = providerReadiness.filter((proof) => proof.status === "complete").length;



  async function activate() {
    if (!currentCoverageComplete) return;
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
    && Number(maxStalenessHours) <= 720
    && currentCoverageComplete;

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

      <section aria-label="Cobertura actual de Context Bridge" className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white">Comprobación actual de las seis fuentes</h3>
          <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${currentCoverageComplete
            ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-300/10 text-amber-200"}`}>
            {currentProofs ? `${completeProviders}/6 vigentes` : "Sin verificar"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Esta vista consulta los checkpoints actuales, no los indicadores COMPLETE del manifiesto histórico.
          Los límites se recalculan según las horas seleccionadas abajo. Una verificación de interfaz
          no sustituye la validación final del servidor.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {REQUIRED_PROVIDERS.map((provider) => {
            const proof = providerReadiness.find((item) => item.provider === provider);
            const status = proof?.status ?? "missing";
            return (
              <div key={provider} className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-bold text-slate-100">{PROVIDER_LABELS[provider]}</p>
                <p className={`mt-1 text-xs font-semibold ${status === "complete"
                  ? "text-emerald-300" : status === "blocked" ? "text-rose-300" : "text-amber-200"}`}>
                  {currentProofs ? (STATUS_LABELS[status] ?? "Sin verificar") : "Sin verificar"}
                </p>
                <p className="mt-1 break-words text-[10px] leading-4 text-slate-500">
                  {proof?.checkpointObservedAt
                    ? `Checkpoint: ${proof.checkpointObservedAt.slice(0, 16).replace("T", " ")} UTC`
                    : "Sin checkpoint verificado"}
                </p>
              </div>
            );
          })}
        </div>
        {!currentCoverageComplete ? (
          <p role="status" className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.045] p-3 text-xs leading-5 text-amber-100">
            Activación no disponible: primero deben actualizarse las evidencias y capacidades
            verificadas de los seis proveedores. Para consultar nuevos checkpoints,
            actualiza esta página. No aumentes el umbral de antigüedad solo para aprobar
            registros históricos.
          </p>
        ) : (
          <p role="status" className="mt-3 text-xs text-emerald-200">
            Seis fuentes vigentes en esta comprobación. La activación final requiere
            la autorización Owner AAL2 y vuelve a verificar toda la cobertura.
          </p>
        )}
      </section>

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
