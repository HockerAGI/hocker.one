"use client";

import { useCallback, useEffect, useState } from "react";

type WorkerTask = {
  id: string; status: string; created_at: string;
  result_hash?: string | null; error?: string | null;
};
type CanaryStatus = {
  ok?: boolean; configured?: boolean; ready_for_single_owner_execution?: boolean;
  already_started?: boolean; task?: WorkerTask | null; error?: string;
};
type CanaryResponse = {
  ok?: boolean; processed?: boolean; run_id?: string;
  task?: { id?: string; result_hash?: string; status?: string };
  error?: string;
};
async function readStatus(): Promise<CanaryStatus> {
  const response = await fetch("/api/agi/free-unified-worker", {
    credentials: "same-origin", cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as CanaryStatus;
  return response.ok ? payload : {
    ok: false, configured: false, error: payload.error ||
      (response.status === 403 ? "Owner MFA AAL2 requerido." : "Estado no disponible."),
  };
}

export default function FreeUnifiedWorkerCanaryPanel() {
  const [state, setState] = useState<CanaryStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<CanaryResponse | null>(null);
  const refresh = useCallback(async () => setState(await readStatus()), []);
  useEffect(() => { void refresh(); }, [refresh]);

  async function authorizeOnce() {
    if (busy || !state?.ready_for_single_owner_execution) return;
    if (!window.confirm(
      "¿Autorizar UNA ejecución nueva de HOSTIA por la ruta unificada Free-only? " +
      "Se creará una tarea exacta de un solo intento; no repetirá pilotos anteriores, " +
      "no usará herramientas, no hará escrituras externas ni seleccionará modelos pagos. " +
      "La prueba NO habilita delegación autónoma ni certifica nodos 24/7."
    )) return;
    setBusy(true);
    setRun(null);
    try {
      const response = await fetch("/api/agi/free-unified-worker", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: "hocker-one", confirm: true }),
      });
      const payload = await response.json().catch(() => ({})) as CanaryResponse;
      setRun(response.ok ? payload : { ok: false, error: payload.error || "No acreditado." });
    } catch {
      setRun({ ok: false, error: "No hay confirmación de ejecución. Consulta el estado persistido." });
    } finally {
      await refresh();
      setBusy(false);
    }
  }

  return (
    <section className="hocker-panel-pro p-5" aria-label="Canario acotado de worker unificado">
      <h2 className="text-lg font-bold text-white">Worker unificado · Acreditación Free-only</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Prueba distinta de los pilotos NOVA y HOSTIA. Un solo trabajo exacto,
        ligado a Owner MFA AAL2 y a una identidad real de worker unificado.
        Usa Workers Free sin herramientas ni fallback de pago. No acredita
        delegación automática ni autonomía operacional.
      </p>
      {!state ? (
        <p className="mt-3 text-sm text-slate-400">Comprobando evidencias reales…</p>
      ) : (
        <div className="mt-3 space-y-3">
          <p role="status" className="text-sm text-slate-200">
            {state.error || (state.already_started
              ? "La única prueba ya fue iniciada. No se repetirá."
              : state.configured
                ? "Ruta disponible; requiere autorización Owner explícita."
                : "Bloqueada: no están verificados todos los controles Free-only.")}
          </p>
          {state.task ? (
            <p className="break-words text-xs text-slate-400">
              Tarea {state.task.id} · {state.task.status}
              {state.task.result_hash ? " · SHA256 " + state.task.result_hash.slice(0, 16) : ""}
            </p>
          ) : null}
          <button type="button" onClick={() => { void authorizeOnce(); }}
            disabled={!state.ready_for_single_owner_execution || busy}
            className="hocker-button-primary disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Verificando ejecución…" : "Autorizar worker unificado Free (MFA)"}
          </button>
        </div>
      )}
      {run ? (
        <p className="mt-3 break-words text-sm text-slate-300" role="status">
          {run.ok && run.processed
            ? "Run persistido: " + (run.run_id ?? "sin identificador")
            : "Ejecución no acreditada: " + (run.error ?? "consulta el estado real")}
        </p>
      ) : null}
    </section>
  );
}
