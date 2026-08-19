"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Play, ShieldCheck, XCircle } from "lucide-react";

import type { AgiToolEvalTarget } from "@/lib/agi-certification";

type ToolEvalTarget = AgiToolEvalTarget;

type CertificationStepResponse = {
  ok?: boolean;
  complete?: boolean;
  halted?: boolean;
  retryable?: boolean;
  continue_after_ms?: number;
  mfa_required?: boolean;
  error?: string;
  progress?: {
    total?: number;
    certified?: number;
    pending?: number;
    runtime_pending?: number;
    tool_pending?: number;
  };
  step?: {
    kind?: "runtime_eval" | "tool_eval" | "complete" | "blocked";
    agi_id?: string | null;
    tool_key?: "supabase" | "github" | null;
    passed?: boolean | null;
  };
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

const MAX_CERTIFICATION_STEPS = 64;
const MAX_TRANSIENT_RESUMES = 2;

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

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function stepLabel(body: CertificationStepResponse): string | null {
  if (body.step?.kind === "runtime_eval" && body.step.agi_id) {
    return `Runtime · ${body.step.agi_id}`;
  }
  if (body.step?.kind === "tool_eval" && body.step.agi_id && body.step.tool_key) {
    return `Tool · ${body.step.agi_id} · ${body.step.tool_key}`;
  }
  if (body.step?.kind === "complete") return "Certificación final";
  return null;
}

export default function AgiEvalBatchControl({
  agiIds,
  runtimeEvalTargets,
  toolEvalTargets,
  certificationSource,
}: AgiEvalBatchControlProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [ceremonyComplete, setCeremonyComplete] = useState(false);
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
      setMessage("El snapshot parcial no permite determinar con certeza qué evidencia está pendiente. La certificación Owner permanece bloqueada hasta recuperar el estado completo del servidor.");
      return;
    }

    if (agiIds.length !== 16 || new Set(agiIds).size !== 16 || invalidRuntimeTarget || invalidToolTarget) {
      setMessage("El catálogo o el plan de evaluación no coincide con las 16 AGIs canónicas. La certificación Owner se bloqueó.");
      return;
    }

    setBusy(true);
    setCeremonyComplete(false);
    setMessage("Certificación iniciada. Hocker One está procesando el siguiente paso pendiente; cada suite puede tardar varios segundos. No vuelvas a pulsar el botón mientras aparezca “Certificando evidencia pendiente…”.");
    let transientResumes = 0;
    let errors = 0;
    let runtimeFailed = 0;

    const publishProgress = (body: CertificationStepResponse) => {
      const runtimePending = Number(body.progress?.runtime_pending ?? runtimeEvalTargets.length);
      const toolPending = Number(body.progress?.tool_pending ?? toolEvalTargets.length);
      const runtimeCompleted = Math.max(0, runtimeEvalTargets.length - runtimePending);
      const toolCompleted = Math.max(0, toolEvalTargets.length - toolPending);
      setProgress({
        runtimeCompleted,
        runtimeTotal: runtimeEvalTargets.length,
        runtimePassed: runtimeCompleted,
        runtimeFailed,
        toolCompleted,
        toolTotal: toolEvalTargets.length,
        toolPassed: toolCompleted,
        errors,
        currentLabel: stepLabel(body),
      });
    };

    try {
      for (let stepIndex = 0; stepIndex < MAX_CERTIFICATION_STEPS; stepIndex += 1) {
        let response: Response;
        let body: CertificationStepResponse;
        try {
          response = await fetch("/api/agi/certification/run", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
          });
          body = (await response.json().catch(() => ({}))) as CertificationStepResponse;
        } catch {
          errors += 1;
          setProgress((current) => ({ ...current, errors, currentLabel: null }));
          setMessage("La certificación Owner perdió conexión antes de completar el siguiente paso. La evidencia ya persistida se conserva y la ceremonia puede reanudarse.");
          return;
        }

        if (redirectForAuth(response.status, body)) return;
        publishProgress(body);

        if (response.ok && body.complete === true) {
          setCeremonyComplete(true);
          setMessage("Certificación Owner completa. Hocker One derivó el resultado final desde evidencia runtime y probes read-only persistidos.");
          router.refresh();
          return;
        }

        if (!response.ok || body.halted === true) {
          if (body.retryable === true && transientResumes < MAX_TRANSIENT_RESUMES) {
            transientResumes += 1;
            const waitMs = Math.max(1_000, Math.min(Number(body.continue_after_ms ?? 20_000), 30_000));
            setMessage(`Límite transitorio detectado. Reanudando automáticamente la misma certificación (${transientResumes}/${MAX_TRANSIENT_RESUMES}) sin repetir evidencia válida.`);
            await pause(waitMs);
            continue;
          }

          errors += 1;
          if (body.step?.kind === "runtime_eval" && body.retryable !== true) runtimeFailed += 1;
          publishProgress(body);
          const failedTarget = stepLabel(body) ?? "El siguiente paso";
          setMessage(
            body.retryable === true
              ? "El proveedor sigue limitado después de los reintentos acotados. La evidencia válida quedó guardada; vuelve a ejecutar la misma certificación para continuar desde el punto pendiente."
              : `${failedTarget} no aprobó la evaluación o requiere remediación. La evidencia válida anterior quedó guardada y no se considera 16/16 hasta resolver únicamente ese punto.`,
          );
          router.refresh();
          return;
        }

        transientResumes = 0;
        const completedTarget = stepLabel(body);
        if (completedTarget) {
          setMessage(`${completedTarget} aprobado. Continuando automáticamente con el siguiente paso pendiente…`);
        }
        const waitMs = Math.max(0, Math.min(Number(body.continue_after_ms ?? 0), 30_000));
        if (waitMs > 0) await pause(waitMs);
      }

      errors += 1;
      setProgress((current) => ({ ...current, errors, currentLabel: null }));
      setMessage("La certificación alcanzó el límite de pasos de seguridad sin cerrar 16/16. La evidencia persistida se conserva; se requiere revisar el snapshot antes de continuar.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const allPassed = ceremonyComplete
    && !busy
    && progress.errors === 0
    && progress.runtimeFailed === 0;

  return (
    <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">Certificación Owner 16/16</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Una sola ceremonia Owner · 16 AGIs · runtime + herramientas read-only · ejecución secuencial y resumible. Requiere una sesión Owner AAL2 válida.
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Pendientes ahora: {runtimeEvalTargets.length} suites runtime + {toolEvalTargets.length} probes de herramientas. Hocker One deriva cada siguiente paso desde evidencia persistida; lo vigente no se repite.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-sky-300/15 bg-sky-300/[0.055] p-3">
        <p className="text-[11px] leading-5 text-slate-400">
          AAL2 usa el <strong className="font-bold text-slate-200">TOTP ya registrado</strong> en Google Authenticator. No necesitas enrolar otro factor; introduce el código vigente directamente en Hocker One.
        </p>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          Si tu sesión ya está en AAL2, Hocker One volverá a <code>/agis</code> sin pedir otro código. Ese comportamiento es esperado.
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
          <span>Snapshot parcial: Hocker One no tiene evidencia completa para calcular el siguiente paso. La certificación Owner permanece bloqueada.</span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={runAllEvals}
        disabled={busy || invalidCatalog || snapshotPartial || nothingPending}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
        {busy ? "Certificando evidencia pendiente…" : nothingPending ? "Evidencia de evals al día" : "Ejecutar certificación Owner única"}
      </button>

      {(busy || progress.runtimeCompleted > 0 || progress.toolCompleted > 0) ? (
        <div className="mt-3 rounded-xl border border-white/8 bg-slate-950/45 px-3 py-2 text-xs text-slate-400" role="status" aria-live="polite">
          <p>Runtime: {progress.runtimeCompleted}/{progress.runtimeTotal} · {progress.runtimePassed} aprobadas · {progress.runtimeFailed} no aprobadas</p>
          <p className="mt-1">Tools: {progress.toolCompleted}/{progress.toolTotal} · {progress.toolPassed} aprobados · {progress.errors} errores acumulados</p>
          {busy && progress.currentLabel ? <p className="mt-1 text-slate-500">Último paso: {progress.currentLabel}</p> : null}
        </div>
      ) : null}

      {invalidCatalog ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs text-rose-100" role="alert">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>El plan de evaluación no corresponde al catálogo canónico. No se ejecutará ningún probe.</span>
        </div>
      ) : null}

      {message ? (
        <div className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${busy ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100" : allPassed ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`} role="status" aria-live="polite">
          {busy ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : allPassed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <span>{message}</span>
        </div>
      ) : null}
    </div>
  );
}
