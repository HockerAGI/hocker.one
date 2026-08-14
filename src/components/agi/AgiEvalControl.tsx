"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Play, ShieldAlert, XCircle } from "lucide-react";

type EvalResponse = {
  ok?: boolean;
  passed?: boolean;
  cases_total?: number;
  cases_passed?: number;
  mfa_required?: boolean;
  error?: string;
};

type AgiEvalControlProps = {
  agiId: string;
  alreadyCertified: boolean;
};

type Outcome = {
  kind: "passed" | "failed" | "error";
  text: string;
};

export default function AgiEvalControl({ agiId, alreadyCertified }: AgiEvalControlProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  async function runEval() {
    if (busy) return;
    setBusy(true);
    setOutcome(null);

    try {
      const response = await fetch("/api/agi/evals/run", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agi_id: agiId }),
      });
      const body = (await response.json().catch(() => ({}))) as EvalResponse;

      if (response.status === 403 && body.mfa_required === true) {
        window.location.assign("/auth/mfa?returnTo=%2Fagis");
        return;
      }

      if (response.status === 401) {
        window.location.assign("/login?reason=authentication_required");
        return;
      }

      if (response.status === 200 || response.status === 422) {
        const casesPassed = Number(body.cases_passed ?? 0);
        const casesTotal = Number(body.cases_total ?? 3);
        const passed = body.passed === true && casesPassed === casesTotal;
        setOutcome({
          kind: passed ? "passed" : "failed",
          text: `${casesPassed}/${casesTotal} casos aprobados.`,
        });
        router.refresh();
        return;
      }

      setOutcome({
        kind: "error",
        text: "No se pudo completar la evaluación. Revisa el estado y vuelve a intentar.",
      });
    } catch {
      setOutcome({
        kind: "error",
        text: "No se pudo conectar con el evaluador. Intenta nuevamente.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-white/8 bg-slate-950/45 p-3">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
            Evaluación controlada
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            3 pruebas · 3 llamadas de IA · sin acciones externas. Puede requerir MFA Owner.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={runEval}
        disabled={busy}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
        {busy ? "Evaluando…" : alreadyCertified ? "Reevaluar 3 casos" : "Evaluar 3 casos"}
      </button>

      {outcome ? (
        <div
          role="status"
          className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
            outcome.kind === "passed"
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : outcome.kind === "failed"
                ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                : "border-rose-300/20 bg-rose-300/10 text-rose-100"
          }`}
        >
          {outcome.kind === "passed" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{outcome.text}</span>
        </div>
      ) : null}
    </div>
  );
}
