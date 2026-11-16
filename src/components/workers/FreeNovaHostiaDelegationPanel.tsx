"use client";
import { useCallback, useEffect, useState } from "react";

type Task = { id: string; status: string; result_hash?: string | null; parent_run_id?: string | null; error?: string | null };
type State = { ok?: boolean; configured?: boolean; can_authorize?: boolean; already_started?: boolean;
  parent?: Task | null; child?: Task | null; error?: string };
type Result = { ok?: boolean; parent?: { run_id: string; task_id: string };
  child?: { run_id: string; task_id: string; parent_run_id: string }; error?: string };

export default function FreeNovaHostiaDelegationPanel() {
  const [state, setState] = useState<State | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/agi/free-nova-hostia-delegation", {
        credentials: "same-origin", cache: "no-store",
      });
      const data = await r.json().catch(() => ({})) as State;
      setState(r.ok ? data : { ok: false, error: data.error ?? "No se pudo consultar el estado." });
    } catch { setState({ ok: false, error: "No se pudo consultar Supabase." }); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  async function authorize() {
    if (running || !state?.can_authorize) return;
    if (!window.confirm(
      "¿Autorizar UNA cadena real NOVA → HOSTIA con dos inferencias Free-only, " +
      "sin herramientas ni acciones materiales? Si falla una etapa no se repetirá automáticamente. " +
      "Esta prueba no habilita delegación autónoma."
    )) return;
    setRunning(true);
    try {
      const res = await fetch("/api/agi/free-nova-hostia-delegation", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: "hocker-one", confirm: true }),
      });
      const data = await res.json().catch(() => ({})) as Result;
      setResult(res.ok ? data : { ok: false, error: data.error ?? "Consultar el estado persistido." });
    } catch { setResult({ ok: false, error: "Sin confirmación. Consultar los registros persistidos; no repetir." }); }
    finally { await refresh(); setRunning(false); }
  }
  return (
    <section className="hocker-panel-pro p-5" aria-label="Delegación NOVA a HOSTIA de solo lectura">
      <h2 className="text-lg font-bold text-white">NOVA → HOSTIA · Delegación verificable Free-only</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Una inferencia real de NOVA y otra de HOSTIA vinculada por parent_run_id.
        Owner MFA AAL2, Workers Free, cero herramientas, cero escrituras externas,
        sin fallback de pago y sin activar despacho autónomo.
      </p>
      <p className="mt-3 text-sm text-slate-200" role="status">
        {!state ? "Consultando evidencia…" : state.error ||
          (state.already_started ? "Esta ceremonia ya comenzó; no se puede repetir."
            : state.configured ? "Disponible con autorización explícita Owner."
              : "Bloqueada hasta verificar la configuración Free-only.")}
      </p>
      {state?.parent ? <p className="mt-2 break-words text-xs text-slate-300">
        NOVA: {state.parent.id} · {state.parent.status}</p> : null}
      {state?.child ? <p className="mt-2 break-words text-xs text-slate-300">
        HOSTIA: {state.child.id} · {state.child.status} · Padre: {state.child.parent_run_id ?? "sin vínculo"}</p> : null}
      <button type="button" onClick={() => { void authorize(); }}
        disabled={!state?.can_authorize || running}
        className="hocker-button-primary mt-4 disabled:cursor-not-allowed disabled:opacity-50">
        {running ? "Verificando cadena…" : "Autorizar NOVA → HOSTIA Free (MFA)"}
      </button>
      {result ? <p className="mt-3 break-words text-sm text-slate-200" role="status">
        {result.ok && result.parent && result.child
          ? "Padre " + result.parent.run_id + " → hija " + result.child.run_id
          : "Cadena no acreditada: " + (result.error ?? "verificar en Supabase")}
      </p> : null}
    </section>
  );
}
