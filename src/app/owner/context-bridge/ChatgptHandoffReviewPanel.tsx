"use client";

import { useCallback, useEffect, useState } from "react";

type ReviewStatus = {
  ok?: boolean;
  error?: string;
  latest?: {
    observed_at?: string;
    external_ref?: string;
    owner_reviewed?: boolean;
  } | null;
};
type SaveResult = { stored?: boolean; error?: string };

const INITIAL_URL =
  "https://github.com/HockerAGI/hocker.one/issues/306#issuecomment-6901778744";

export default function ChatgptHandoffReviewPanel() {
  const [handoffUrl, setHandoffUrl] = useState(INITIAL_URL);
  const [status, setStatus] = useState<ReviewStatus | null>(null);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/context-bridge/chatgpt/handoff-review", {
        method: "GET", cache: "no-store", credentials: "same-origin",
      });
      const data = await r.json() as ReviewStatus;
      setStatus(r.ok ? data : { ok: false, error: data.error ?? "Estado no disponible." });
    } catch {
      setStatus({ ok: false, error: "Estado de handoff no disponible." });
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function saveReview() {
    if (busy || !handoffUrl.trim()) return;
    if (!window.confirm(
      "¿Registrar el handoff documental como REVISADO por Owner MFA? " +
      "NO certifica la identidad de sesión ChatGPT, NO aumenta la cobertura 3/6 " +
      "y NO activa ningún manifiesto.",
    )) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch("/api/context-bridge/chatgpt/handoff-review", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: "hocker-one",
          handoff_url: handoffUrl.trim(),
          confirm: true,
        }),
      });
      const data = await r.json().catch(() => ({})) as SaveResult;
      setResult(r.ok && data.stored ? data : {
        stored: false, error: data.error ?? "No se registró la revisión.",
      });
      await refresh();
    } catch {
      setResult({
        stored: false,
        error: "No se confirmó el registro. Comprueba el estado antes de repetir.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="hocker-panel-pro p-5" aria-label="Revisión de handoff ChatGPT con MFA Owner">
      <p className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-300">
        Context Bridge · ChatGPT · Owner AAL2
      </p>
      <h2 className="mt-2 text-lg font-bold text-white">Registrar handoff revisado</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Comprueba el comentario de continuidad en GitHub #306 y registra la revisión Owner.
        No importa conversaciones completas, no certifica una sesión de ChatGPT y
        no altera la cobertura de proveedores.
      </p>
      <label className="mt-4 grid gap-2">
        <span className="text-xs font-semibold text-slate-300">URL del handoff · Issue #306</span>
        <input
          type="url"
          value={handoffUrl}
          onChange={(event) => setHandoffUrl(event.target.value)}
          maxLength={260}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
        />
      </label>
      {status?.latest?.owner_reviewed ? (
        <p role="status" className="mt-3 text-xs text-slate-300">
          Revisión Owner registrada: {String(status.latest.observed_at ?? "sin fecha")}.
          La procedencia de la sesión ChatGPT sigue pendiente.
        </p>
      ) : status?.error ? (
        <p role="status" className="mt-3 text-xs text-amber-200">{status.error}</p>
      ) : (
        <p className="mt-3 text-xs text-slate-400">
          Sin nueva revisión confirmada. Las evidencias históricas se conservan.
        </p>
      )}
      <button
        type="button"
        onClick={() => { void saveReview(); }}
        disabled={busy || !handoffUrl.trim()}
        className="hocker-button-primary mt-4 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Comprobando GitHub…" : "Registrar revisión de ChatGPT con MFA"}
      </button>
      {result ? (
        <p role="status"
           className={result.stored ? "mt-3 text-sm text-emerald-200" : "mt-3 text-sm text-amber-200"}>
          {result.stored
            ? "Handoff guardado como revisión PARCIAL. La sesión ChatGPT aún no está certificada."
            : result.error ?? "No se registró."}
        </p>
      ) : null}
    </section>
  );
}
