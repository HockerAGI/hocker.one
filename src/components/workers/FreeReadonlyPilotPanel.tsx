"use client";

import { useCallback, useEffect, useState } from "react";

type PilotTask = {
  id?: string; status?: string; created_at?: string;
  result_hash?: string | null; error?: string | null;
  output?: { summary?: string } | null;
};
type PilotState = {
  ok?: boolean; configured?: boolean; ready_for_single_owner_pilot?: boolean;
  task?: PilotTask | null; model?: string; error?: string;
  already_started_today?: boolean;
  specialist_ready_for_single_owner_pilot?: boolean;
  specialist_already_started_today?: boolean;
  specialist_task?: PilotTask | null;
};
type PilotRun = {
  ok?: boolean; error?: string; task_id?: string; run_id?: string;
  result_hash?: string; summary?: string; model?: string;
};

/**
 * Render model-authored Markdown as escaped React text, never HTML.
 * A persisted response is evidence of inference, not a verified diagnosis.
 */
function inlineEmphasis(value: string) {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>
      : part,
  );
}

function PilotSummary({ summary }: { summary: string }) {
  return (
    <div className="mt-3 space-y-2 break-words text-sm leading-6 text-slate-200">
      {summary.split(/\r?\n/).map((raw, index) => {
        const line = raw.trim();
        if (!line) return null;
        const heading = /^#{1,5}\s+(.+)$/.exec(line);
        if (heading) {
          return <h3 key={index} className="pt-2 font-bold text-white">{inlineEmphasis(heading[1] ?? "")}</h3>;
        }
        const bullet = /^[-*]\s+(.+)$/.exec(line);
        if (bullet) {
          return <p key={index} className="pl-4">• {inlineEmphasis(bullet[1] ?? "")}</p>;
        }
        return <p key={index}>{inlineEmphasis(line)}</p>;
      })}
    </div>
  );
}

async function queryPilot(): Promise<PilotState> {
  const response = await fetch("/api/agi/free-pilot", {
    method: "GET", cache: "no-store", credentials: "same-origin",
  });
  const payload = await response.json().catch(() => ({})) as PilotState;
  if (!response.ok) return {
    ok: false, configured: false,
    error: response.status === 401 || response.status === 403
      ? "Solo Owner con MFA AAL2 puede ejecutar este piloto."
      : payload.error || "No se pudo verificar el piloto.",
  };
  return payload;
}

export default function FreeReadonlyPilotPanel() {
  const [state, setState] = useState<PilotState | null>(null);
  const [run, setRun] = useState<PilotRun | null>(null);
  const [specialistRun, setSpecialistRun] = useState<PilotRun | null>(null);
  const [busy, setBusy] = useState(false);
  const summary = run?.summary ||
    (state?.task?.status === "completed" ? state.task.output?.summary : undefined);
  const specialistSummary = specialistRun?.summary ||
    (state?.specialist_task?.status === "completed" ? state.specialist_task.output?.summary : undefined);
  const refresh = useCallback(async () => setState(await queryPilot()), []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function executePilot(agent: "nova" | "hostia") {
    const ready = agent === "hostia"
      ? state?.specialist_ready_for_single_owner_pilot
      : state?.ready_for_single_owner_pilot;
    if (busy || !ready) return;
    const confirmed = window.confirm(
      "¿Autorizar UNA inferencia real de " + (agent === "hostia" ? "HOSTIA" : "NOVA") +
      " en Workers AI Free? Solo analizará conteos actuales de Supabase, " +
      "sin herramientas, sin acciones materiales ni fallback de pago. " +
      "Requiere Owner MFA AAL2 y solo se admite una prueba por día UTC y agente.",
    );
    if (!confirmed) return;
    setBusy(true);
    const updateRun = agent === "hostia" ? setSpecialistRun : setRun;
    updateRun(null);
    try {
      const response = await fetch("/api/agi/free-pilot", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: "hocker-one", confirm: true, agent }),
      });
      const result = await response.json().catch(() => ({})) as PilotRun;
      updateRun(result.ok && response.ok
        ? result
        : { ok: false, error: result.error || "Ejecución no certificada." });
      await refresh();
    } catch {
      updateRun({ ok: false, error: "No hubo confirmación de ejecución; consulta el estado real." });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="hocker-panel-pro p-5" aria-label="Prueba real AGI sin gastos ni acciones">
      <h2 className="text-lg font-bold text-white">Piloto NOVA · Solo lectura (Workers Free)</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Una sola tarea real por día UTC, iniciada exclusivamente por Owner MFA.
        Análisis de conteos actuales de Supabase, con modelo fijo, sin herramientas
        y sin ejecuciones externas. No es autonomía permanente.
      </p>
      <p className="mt-2 text-xs leading-5 text-amber-200">
        Nota: el texto generado por NOVA no es un diagnóstico operativo certificado.
        Una cola vacía no significa que las 16 AGIs estén apagadas, y
        allow_actions=false es una protección para acciones materiales.
        No lo habilites globalmente por recomendación de este análisis.
      </p>
      {!state ? (
        <p className="mt-3 text-sm text-slate-400">Comprobando controles reales…</p>
      ) : (
        <div className="mt-3 space-y-3">
          <p role="status" className="text-sm text-slate-200">
            {state.error ? state.error : state.configured
              ? state.already_started_today
                ? "Hoy ya se inició el único piloto permitido. No se repetirá."
                : "Ruta Free verificada y piloto habilitado; requiere confirmación explícita."
              : "Bloqueado: configuración Free en producción o habilitación específica pendiente. No se enviará inferencia."}
          </p>
          {state.task ? (
            <p className="text-xs text-slate-400">
              Última tarea de hoy: {state.task.status || "sin verificar"}
              {state.task.result_hash ? " · Resultado persistido: " + state.task.result_hash.slice(0, 12) : ""}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => { void executePilot("nova"); }}
            disabled={!state.ready_for_single_owner_pilot || busy}
            className="hocker-button-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Ejecutando con evidencia…" : "Autorizar un análisis real (MFA)"}
          </button>
        </div>
      )}
      {run || summary ? (
        <div className="mt-4 rounded-lg border border-white/10 p-3 text-sm text-slate-200">
          <p className="font-semibold">
            {run && !run.ok ? run.error || "Bloqueado" : "Inferencia real persistida"}
          </p>
          {summary ? <PilotSummary summary={summary} /> : null}
          {(run?.result_hash || state?.task?.result_hash) ? (
            <p className="mt-3 break-all text-xs text-slate-400">
              SHA256: {run?.result_hash || state?.task?.result_hash}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-6 border-t border-white/10 pt-5">
        <h3 className="text-lg font-bold text-white">HOSTIA · Prueba de especialista (Workers Free)</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Una inferencia real de HOSTIA por día UTC, usando su perfil canónico de
          infraestructura y el mismo modelo Free. Sin acceso a servidores,
          comandos, repositorios, herramientas ni escritura. Es una prueba acotada
          de identidad y análisis; no acredita el worker general ni autonomía.
        </p>
        {state ? (
          <div className="mt-3 space-y-3">
            <p role="status" className="text-sm text-slate-200">
              {state.error || (state.specialist_already_started_today
                ? "La prueba HOSTIA ya fue iniciada hoy; no se repetirá."
                : state.configured
                  ? "Prueba HOSTIA disponible bajo autorización Owner AAL2."
                  : "Prueba HOSTIA bloqueada: falta configuración Workers Free.")}
            </p>
            {state.specialist_task ? (
              <p className="break-words text-xs text-slate-400">
                Estado: {state.specialist_task.status || "sin verificar"}
                {state.specialist_task.result_hash
                  ? " · SHA256 " + state.specialist_task.result_hash.slice(0, 12) : ""}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => { void executePilot("hostia"); }}
              disabled={!state.specialist_ready_for_single_owner_pilot || busy}
              className="hocker-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Verificando ejecución…" : "Autorizar prueba HOSTIA (MFA)"}
            </button>
          </div>
        ) : null}
        {specialistRun || specialistSummary ? (
          <div className="mt-4 rounded-lg border border-white/10 p-3 text-sm text-slate-200">
            <p className="font-semibold">
              {specialistRun && !specialistRun.ok
                ? specialistRun.error || "Bloqueado"
                : "Inferencia especialista persistida"}
            </p>
            {specialistSummary ? <PilotSummary summary={specialistSummary} /> : null}
            {(specialistRun?.result_hash || state?.specialist_task?.result_hash) ? (
              <p className="mt-3 break-all text-xs text-slate-400">
                SHA256: {specialistRun?.result_hash || state?.specialist_task?.result_hash}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
