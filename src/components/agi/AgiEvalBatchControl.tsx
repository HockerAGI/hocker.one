"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Play, RotateCw, XCircle } from "lucide-react";
import type { AgiToolEvalTarget } from "@/lib/agi-certification";

type ToolEvalTarget = AgiToolEvalTarget;
type CertificationStepResponse = {
  ok?: boolean; complete?: boolean; halted?: boolean; retryable?: boolean; continue_after_ms?: number;
  mfa_required?: boolean; error?: string;
  progress?: { total?: number; certified?: number; pending?: number; runtime_pending?: number; tool_pending?: number };
  step?: { kind?: "runtime_eval" | "tool_eval" | "complete" | "blocked"; agi_id?: string | null; tool_key?: "supabase" | "github" | null; passed?: boolean | null };
};

type AgiEvalBatchControlProps = {
  agiIds: string[];
  runtimeEvalTargets: string[];
  toolEvalTargets: ToolEvalTarget[];
  certificationSource: "supabase+code" | "partial";
};

type BatchProgress = { runtimeCompleted: number; runtimeTotal: number; toolCompleted: number; toolTotal: number; currentLabel: string | null };
const MAX_CERTIFICATION_STEPS = 64;
const MAX_TRANSIENT_RESUMES = 2;

function redirectForAuth(status: number, body: { mfa_required?: boolean }): boolean {
  if (status === 403 && body.mfa_required === true) { window.location.assign("/auth/mfa?returnTo=%2Fagis"); return true; }
  if (status === 401) { window.location.assign("/login?reason=authentication_required"); return true; }
  return false;
}
function pause(ms: number): Promise<void> { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
function stepLabel(body: CertificationStepResponse): string | null {
  if (body.step?.kind === "runtime_eval" && body.step.agi_id) return `Revisando ${body.step.agi_id.toUpperCase()}`;
  if (body.step?.kind === "tool_eval" && body.step.agi_id) return `Comprobando ${body.step.agi_id.toUpperCase()}`;
  if (body.step?.kind === "complete") return "Revisión completa";
  return null;
}

export default function AgiEvalBatchControl({ agiIds, runtimeEvalTargets, toolEvalTargets, certificationSource }: AgiEvalBatchControlProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [resumeNeeded, setResumeNeeded] = useState(false);
  const [attentionId, setAttentionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<BatchProgress>({ runtimeCompleted: 0, runtimeTotal: runtimeEvalTargets.length, toolCompleted: 0, toolTotal: toolEvalTargets.length, currentLabel: null });

  const canonical = new Set(agiIds);
  const invalidCatalog = agiIds.length !== 16 || new Set(agiIds).size !== 16 || runtimeEvalTargets.some((id) => !canonical.has(id)) || toolEvalTargets.some((item) => !canonical.has(item.agi_id));
  const snapshotPartial = certificationSource === "partial";
  const nothingPending = runtimeEvalTargets.length === 0 && toolEvalTargets.length === 0;

  function publish(body: CertificationStepResponse) {
    const runtimePending = Number(body.progress?.runtime_pending ?? runtimeEvalTargets.length);
    const toolPending = Number(body.progress?.tool_pending ?? toolEvalTargets.length);
    setProgress({
      runtimeCompleted: Math.max(0, runtimeEvalTargets.length - runtimePending),
      runtimeTotal: runtimeEvalTargets.length,
      toolCompleted: Math.max(0, toolEvalTargets.length - toolPending),
      toolTotal: toolEvalTargets.length,
      currentLabel: stepLabel(body),
    });
  }

  async function runAllEvals() {
    if (busy || snapshotPartial || invalidCatalog || nothingPending) return;
    setBusy(true); setResumeNeeded(false); setAttentionId(null); setMessage("En proceso. Puedes dejar que Hocker One continúe; lo ya aprobado se conserva.");
    let transientResumes = 0;
    try {
      for (let stepIndex = 0; stepIndex < MAX_CERTIFICATION_STEPS; stepIndex += 1) {
        let response: Response;
        let body: CertificationStepResponse;
        try {
          response = await fetch("/api/agi/certification/run", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" } });
          body = (await response.json().catch(() => ({}))) as CertificationStepResponse;
        } catch {
          setResumeNeeded(true); setMessage("Se perdió la conexión. Lo ya realizado se conserva."); return;
        }
        if (redirectForAuth(response.status, body)) return;
        publish(body);
        if (response.ok && body.complete === true) {
          setComplete(true); setMessage("Listo. La revisión terminó y la evidencia quedó guardada."); router.refresh(); return;
        }
        if (!response.ok || body.halted === true) {
          if (body.retryable === true && transientResumes < MAX_TRANSIENT_RESUMES) {
            transientResumes += 1;
            setMessage("Pausa temporal. Reintentando sin repetir lo ya aprobado.");
            await pause(Math.max(1_000, Math.min(Number(body.continue_after_ms ?? 20_000), 30_000)));
            continue;
          }
          if (body.retryable === true) {
            setResumeNeeded(true); setMessage("La revisión puede reanudarse. Lo ya realizado se conserva.");
          } else {
            setAttentionId(body.step?.agi_id ?? null); setMessage(`${body.step?.agi_id?.toUpperCase() ?? "Una AGI"} requiere atención. Lo anterior se conserva.`);
          }
          router.refresh(); return;
        }
        transientResumes = 0;
        const waitMs = Math.max(0, Math.min(Number(body.continue_after_ms ?? 0), 30_000));
        if (waitMs) await pause(waitMs);
      }
      setResumeNeeded(true); setMessage("La revisión se detuvo por seguridad. Puedes reanudarla sin perder avances."); router.refresh();
    } finally { setBusy(false); }
  }

  if (nothingPending || complete) {
    return <div className="flex items-center gap-2 rounded-xl bg-emerald-400/8 px-3 py-2 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />Listo</div>;
  }
  if (snapshotPartial || invalidCatalog) {
    return (
      <div className="rounded-xl border border-amber-300/15 bg-amber-300/8 p-3 text-sm text-amber-100">
        <p>No se pudo confirmar el estado. No se ejecutará ninguna prueba.</p>
        <Link href="/agis" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/[0.06] px-4 font-semibold"><RotateCw className="h-4 w-4" />Reintentar</Link>
      </div>
    );
  }
  if (attentionId) {
    return (
      <div className="rounded-xl border border-amber-300/15 bg-amber-300/8 p-3 text-sm text-amber-100">
        <p>{message}</p>
        <a href={`#agi-${attentionId}`} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-white/[0.06] px-4 font-semibold">Ver detalle</a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
      {busy ? (
        <div role="status" aria-live="polite" className="flex items-start gap-3 text-sm text-slate-300">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-sky-300" />
          <div><p className="font-semibold text-white">En proceso</p><p className="mt-1 text-xs text-slate-500">{progress.currentLabel ?? "Comprobando el siguiente punto"} · AGIs {progress.runtimeCompleted}/{progress.runtimeTotal} · Herramientas {progress.toolCompleted}/{progress.toolTotal}</p></div>
        </div>
      ) : (
        <button type="button" onClick={() => void runAllEvals()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-300 px-4 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-100">
          <Play className="h-4 w-4" />{resumeNeeded ? "Reanudar" : "Verificar y continuar"}
        </button>
      )}
      {!busy && !resumeNeeded ? <p className="mt-2 text-center text-xs text-slate-500">Si tu sesión necesita verificación, se pedirá el código antes de continuar.</p> : null}
      {resumeNeeded ? <p className="mt-2 text-center text-xs text-slate-500">Continuar revisión conserva lo ya aprobado.</p> : null}
      {message ? <p className="mt-2 text-xs text-slate-400" role="status" aria-live="polite">{message}</p> : null}
      {resumeNeeded ? <span className="sr-only">Continuar revisión</span> : null}
      <span className="sr-only">Pendiente · Requiere atención</span>
    </div>
  );
}
