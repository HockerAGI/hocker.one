"use client";

import { useState, useTransition } from "react";

type Props = {
  learningEventId: string;
  projectId?: string;
  disabled?: boolean;
};

type ApiResult = {
  ok?: boolean;
  message?: string;
  reason?: string;
};

export default function MemoryReviewDecisionButtons({
  learningEventId,
  projectId = "hocker-one",
  disabled = false,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string>("");

  function decide(decision: "approved" | "rejected" | "blocked", publishToMemory: boolean) {
    setResult("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/agi/runtime/memory/review", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "decision",
            project_id: projectId,
            learning_event_id: learningEventId,
            decision,
            publish_to_memory: publishToMemory,
            reason:
              decision === "approved"
                ? "Aprobado desde Memory Review UI 12.7H por Owner real."
                : decision === "blocked"
                  ? "Bloqueado desde Memory Review UI 12.7H por política de seguridad."
                  : "Rechazado desde Memory Review UI 12.7H.",
          }),
        });

        const data = (await res.json().catch(() => ({}))) as ApiResult;

        if (!res.ok || !data.ok) {
          setResult(data.reason || data.message || "No se pudo registrar la decisión.");
          return;
        }

        setResult(data.message || "Decisión registrada.");
        window.setTimeout(() => window.location.reload(), 900);
      } catch (err) {
        setResult(err instanceof Error ? err.message : "Error al registrar decisión.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || isPending}
          onClick={() => decide("approved", true)}
          className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Aprobar + publicar
        </button>

        <button
          type="button"
          disabled={disabled || isPending}
          onClick={() => decide("rejected", false)}
          className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Rechazar
        </button>

        <button
          type="button"
          disabled={disabled || isPending}
          onClick={() => decide("blocked", false)}
          className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Bloquear
        </button>
      </div>

      {result ? (
        <p className="text-[11px] font-bold text-slate-400">
          {result}
        </p>
      ) : null}
    </div>
  );
}
