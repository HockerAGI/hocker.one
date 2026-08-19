"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Play, ShieldCheck, XCircle } from "lucide-react";

import type { AgiToolEvalTarget } from "@/lib/agi-certification";

type ToolEvalTarget = AgiToolEvalTarget;

type RuntimeEvalResponse = {
  passed?: boolean;
  cases_total?: number;
  cases_passed?: number;
  mfa_required?: boolean;
  error?: string;
};

type ToolEvalResponse = {
  passed?: boolean;
  mode?: string;
  external_writes_executed?: boolean;
  evidence_ref?: string;
  mfa_required?: boolean;
  error?: string;
};

type AgiEvalBatchControlProps = {
  agiIds: string[];
  runtimeEvalTargets: string[];
  toolEvalTargets: ToolEvalTarget[];
  certificationSource: "supabase+code" | "partial";
};

type BatchProgress = {
  runtimeCompleted: number;
  runtimeTotal: number;
  runtimePassed: number;
  runtimeFailed: number;
  toolCompleted: number;
  toolTotal: number;
  toolPassed: number;
  errors: number;
  currentLabel: string | null;
};

function initialProgress(runtimeTotal: number, toolTotal: number): BatchProgress {
  return {
    runtimeCompleted: 0,
    runtimeTotal,
    runtimePassed: 0,
    runtimeFailed: 0,
    toolCompleted: 0,
    toolTotal,
    toolPassed: 0,
    errors: 0,
    currentLabel: null,
  };
}

function redirectForAuth(status: number, body: { mfa_required?: boolean }): boolean {
  if (status === 403 && body.mfa_required === true) {
    window.location.assign("/auth/mfa?returnTo=%2Fagis");
    return true;
  }
  if (status === 401) {
    window.location.assign("/login?reason=authentication_required");
    return true;
  }
  return false;
}

export default function AgiEvalBatchControl({
  agiIds,
  runtimeEvalTargets,
  toolEvalTargets,
  certificationSource,
}: AgiEvalBatchControlProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>(() => initialProgress(runtimeEvalTargets.length, toolEvalTargets.length));
  const [message, setMessage] = useState<string | null>(null);

  const allCanonicalIds = new Set(agiIds);
  const invalidRuntimeTarget = runtimeEvalTargets.some((agiId) => !allCanonicalIds.has(agiId));
  const invalidToolTarget = toolEvalTargets.some((target) => !allCanonicalIds.has(target.agi_id));
  const invalidCatalog = agiIds.length !== 16 || new Set(agiIds).size !== 16 || invalidRuntimeTarget || invalidToolTarget;
  const snapshotPartial = certificationSource === "partial";
  const nothingPending = runtimeEvalTargets.length === 0 && toolEvalTargets.length === 0;

  async function runAllEvals() {
    if (busy) return;

    if (snapshotPartial) {
      setMessage("El snapshot parcial no permite determinar con certeza qué evidencia está pendiente. La certificación masiva permanece bloqueada hasta recuperar el estado completo del servidor.");
      return;
    }

    if (agiIds.length !== 16 || new Set(agiIds).size !== 16 || invalidRuntimeTarget || invalidToolTarget) {
      setMessage("El catálogo o el plan de evaluación no coincide con las 16 AGIs canónicas. La certificación masiva se bloqueó.");
      return;
    }

    setBusy(true);
    setMessage(null);
    let runtimeCompleted = 0;
    let runtimePassed = 0;
    let runtimeFailed = 0;
    let toolCompleted = 0;
    let toolPassed = 0;
    let errors = 0;

    const publishProgress = (currentLabel: string | null) => {
      setProgress({
        runtimeCompleted,
        runtimeTotal: runtimeEvalTargets.length,
        runtimePassed,
        runtimeFailed,
        toolCompleted,
        toolTotal: toolEvalTargets.length,
        toolPassed,
        errors,
        currentLabel,
      });
    };

    try {
      for (const agiId of runtimeEvalTargets) {
        publishProgress(`Runtime · ${agiId}`);
        try {
          const response = await fetch("/api/agi/evals/run", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agi_id: agiId }),
          });
          const body = (await response.json().catch(() => ({}))) as RuntimeEvalResponse;

          if (redirectForAuth(response.status, body)) return;

          runtimeCompleted += 1;
          if (response.status === 200 || response.status === 422) {
            const casesPassed = Number(body.cases_passed ?? 0);
            const casesTotal = Number(body.cases_total ?? 3);
            if (body.passed === true && casesPassed === casesTotal) runtimePassed += 1;
            else runtimeFailed += 1;
          } else {
            errors += 1;
          }
        } catch {
          runtimeCompleted += 1;
          errors += 1;
        }
      }

      for (const target of toolEvalTargets) {
        publishProgress(`Tool · ${target.agi_id} · ${target.tool_key}`);
        try {
          const response = await fetch("/api/agi/tools/eval", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agi_id: target.agi_id, tool_key: target.tool_key }),
          });
          const body = (await response.json().catch(() => ({}))) as ToolEvalResponse;

          if (redirectForAuth(response.status, body)) return;

          toolCompleted += 1;
          if (
            response.status === 200
            && body.passed === true
            && body.mode === "read_only"
            && body.external_writes_executed === false
            && typeof body.evidence_ref === "string"
            && body.evidence_ref.length > 0
          ) {
            toolPassed += 1;
          } else {
            errors += 1;
          }
        } catch {
          toolCompleted += 1;
          errors += 1;
        }
      }

      publishProgress(null);
      const runtimeComplete = runtimeCompleted === runtimeEvalTargets.length
        && runtimePassed === runtimeEvalTargets.length
        && runtimeFailed === 0;
      const toolsComplete = toolCompleted === toolEvalTargets.length
        && toolPassed === toolEvalTargets.length;

      setMessage(
        errors === 0 && runtimeComplete && toolsComplete
          ? "La evidencia runtime y de herramientas terminó correctamente. Actualizando el snapshot del servidor; la certificación final sigue siendo derivada por Hocker One."
          : "La ronda terminó con evidencia parcial. Revisa las AGIs o tools no aprobadas; no se considera certificación completa.",
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const allPassed = !busy
    && progress.errors === 0
    && progress.runtimeCompleted === progress.runtimeTotal
    && progress.runtimePassed === progress.runtimeTotal
    && progress.runtimeFailed === 0
    && progress.toolCompleted === progress.toolTotal
    && progress.toolPassed === progress.toolTotal
    && (progress.runtimeTotal > 0 || progress.toolTotal > 0);

  return (
    <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">Certificación Owner 16/16</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            16 AGIs · hasta 48 llamadas de IA · {toolEvalTargets.length} probes read-only pendientes · ejecución secuencial. Requiere una sesión Owner AAL2 válida.
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Pendientes ahora: {runtimeEvalTargets.length} suites runtime + {toolEvalTargets.length} probes de herramientas. La evidencia ya vigente no se repite.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-sky-300/15 bg-sky-300/[0.055] p-3">
        <p className="text-[11px] leading-5 text-slate-400">
          AAL2 usa el <strong className="font-bold text-slate-200">TOTP ya registrado</strong> en Google Authenticator. No necesitas enrolar otro factor; introduce el código vigente directamente en Hocker One.
        </p>
        <Link
          href="/auth/mfa?returnTo=%2Fagis"
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-sky-100 transition hover:bg-sky-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          Elevar sesión a AAL2
        </Link>
      </div>

      {snapshotPartial ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100" role="alert">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Snapshot parcial: Hocker One no tiene evidencia completa para calcular qué evals están pendientes. La ejecución masiva permanece bloqueada.</span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={runAllEvals}
        disabled={busy || invalidCatalog || snapshotPartial || nothingPending}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
        {busy ? "Ejecutando evidencia pendiente…" : nothingPending ? "Evidencia de evals al día" : "Ejecutar evidencia pendiente"}
      </button>

      {(busy || progress.runtimeCompleted > 0 || progress.toolCompleted > 0) ? (
        <div className="mt-3 rounded-xl border border-white/8 bg-slate-950/45 px-3 py-2 text-xs text-slate-400" role="status">
          <p>Runtime: {progress.runtimeCompleted}/{progress.runtimeTotal} · {progress.runtimePassed} aprobadas · {progress.runtimeFailed} no aprobadas</p>
          <p className="mt-1">Tools: {progress.toolCompleted}/{progress.toolTotal} · {progress.toolPassed} aprobados · {progress.errors} errores acumulados</p>
          {busy && progress.currentLabel ? <p className="mt-1 text-slate-500">Actual: {progress.currentLabel}</p> : null}
        </div>
      ) : null}

      {invalidCatalog ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs text-rose-100" role="alert">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>El plan de evaluación no corresponde al catálogo canónico. No se ejecutará ningún probe.</span>
        </div>
      ) : null}

      {message ? (
        <div className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${allPassed ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`} role="status">
          {allPassed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <span>{message}</span>
        </div>
      ) : null}
    </div>
  );
}
