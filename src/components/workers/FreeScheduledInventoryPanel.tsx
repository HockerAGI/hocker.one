"use client";

import { useCallback, useEffect, useState } from "react";

type Task = {
  id: string; status: string; result_hash?: string | null;
  created_at?: string; completed_at?: string | null; error?: string | null;
};
type InventoryState = {
  ok?: boolean; configured?: boolean; can_authorize?: boolean;
  already_authorized_today?: boolean; task?: Task | null;
  code?: string;
};
type Authorization = { ok?: boolean; approved?: boolean; task_id?: string; code?: string };

export default function FreeScheduledInventoryPanel() {
  const [status, setStatus] = useState<InventoryState | null>(null);
  const [result, setResult] = useState<Authorization | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/agi/free-inventory", {
        credentials: "same-origin", cache: "no-store",
      });
      const data = await response.json().catch(() => ({})) as InventoryState;
      setStatus(response.ok ? data : { ok: false, code: data.code || "FREE_INVENTORY_STATE_UNAVAILABLE" });
    } catch {
      setStatus({ ok: false, code: "FREE_INVENTORY_NETWORK_UNAVAILABLE" });
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function authorize() {
    if (busy || !status?.can_authorize) return;
    if (!window.confirm(
      "¿Autorizar UNA tarea real de inventario Supabase para NOVA, ejecutada " +
      "en el siguiente ciclo del coordinador Cloudflare? Usará únicamente " +
      "conteos de datos internos, sin modelos IA, herramientas, comandos ni " +
      "acciones externas. Máximo una autorización por día UTC; " +
      "si caduca no se repetirá automáticamente."
    )) return;

    setBusy(true);
    try {
      const response = await fetch("/api/agi/free-inventory", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: "hocker-one", confirm: true }),
      });
      const data = await response.json().catch(() => ({})) as Authorization;
      setResult(response.ok ? data : { ok: false, code: data.code || "FREE_INVENTORY_APPROVAL_UNVERIFIED" });
    } catch {
      setResult({ ok: false, code: "FREE_INVENTORY_NETWORK_UNAVAILABLE" });
    } finally {
      await refresh();
      setBusy(false);
    }
  }

  return (
    <section className="hocker-panel-pro p-5" aria-label="Autorización de inventario serverless">
      <h2 className="text-lg font-bold text-white">
        NOVA · Inventario programado, autorizado por Owner
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Una tarea verificable al día UTC, sin IA ni herramientas. El Owner
        autoriza con MFA AAL2; Cloudflare ejecuta únicamente un inventario
        de conteos de Supabase, con task, run y evidencia persistida.
        Sin proveedores nuevos ni fallback de pago.
      </p>
      <p className="mt-2 text-xs text-amber-200">
        Es una automatización real de datos, no una inferencia ni autonomía de
        modificación de repositorios. La aprobación caduca a los 20 minutos
        si el coordinador no puede procesarla.
      </p>
      <p role="status" className="mt-3 text-sm text-slate-200">
        {!status ? "Consultando Supabase…" : status.code ||
          (status.task
            ? "Tarea de hoy: " + status.task.status
            : status.configured
              ? "Puede autorizar una sola tarea programada con MFA."
              : "Cerrado hasta verificar despliegue y credencial separada.")}
      </p>
      {status?.task ? (
        <div className="mt-3 break-all text-xs text-slate-300">
          <p>Task: {status.task.id}</p>
          <p>Estado: {status.task.status}</p>
          {status.task.result_hash ? <p>SHA-256: {status.task.result_hash}</p> : null}
          {status.task.error ? <p>Diagnóstico: {status.task.error}</p> : null}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => { void authorize(); }}
          disabled={busy || !status?.can_authorize}
          className="hocker-button-primary disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Registrando aprobación…" : "Autorizar inventario NOVA (MFA)"}
        </button>
        <button type="button" onClick={() => { void refresh(); }}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">
          Actualizar evidencia
        </button>
      </div>
      {result ? (
        <p role="status" className="mt-3 break-all text-sm text-slate-200">
          {result.approved && result.task_id
            ? "Aprobación real guardada. Task: " + result.task_id
            : "No autorizado: " + (result.code ?? "verificar registros")}
        </p>
      ) : null}
    </section>
  );
}
