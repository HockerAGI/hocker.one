"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeOwnerActions, type OwnerLiveAction } from "@/components/hocker-2c/owner/live/owner-live-normalizers";

type Decision = "approve" | "reject";

const ACTION_ID_KEY = "action_id";
const DEFAULT_PROJECT_ID = "hocker-one";

async function loadPendingActions(): Promise<OwnerLiveAction[]> {
  const urls = [
    "/api/agi/runtime/actions?project_id=hocker-one&limit=30",
    "/api/agi/runtime/actions?limit=30",
    "/api/commands",
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) continue;

      const actions = normalizeOwnerActions(payload);
      if (actions.length > 0) return actions;
    } catch {
      // Keep fallback chain.
    }
  }

  return [];
}

function needsOwnerApproval(status: string) {
  const clean = status.toLowerCase();

  if (
    clean.includes("completada") ||
    clean.includes("falló") ||
    clean.includes("fallo") ||
    clean.includes("revertida") ||
    clean.includes("rechazada") ||
    clean.includes("ejecutándose") ||
    clean.includes("ejecutandose") ||
    clean.includes("aprobada")
  ) {
    return false;
  }

  return (
    clean.includes("aprobación") ||
    clean.includes("aprobacion") ||
    clean.includes("preparada") ||
    clean.includes("pending") ||
    clean.includes("needs") ||
    clean.includes("queued")
  );
}

function riskLabel(risk: OwnerLiveAction["risk"]) {
  if (risk === "high") return "Riesgo alto";
  if (risk === "medium") return "Riesgo medio";
  return "Riesgo bajo";
}

function riskClass(risk: OwnerLiveAction["risk"]) {
  if (risk === "high") return "border-rose-300/30 bg-rose-300/10 text-rose-100";
  if (risk === "medium") return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
}

function NovaInlineApprovalCard({
  action,
  onDone,
}: {
  action: OwnerLiveAction;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<Decision | "adjust" | null>(null);
  const [message, setMessage] = useState("");

  async function sendDecision(decision: Decision, fallbackNote: string, busyState: Decision | "adjust") {
    setBusy(busyState);
    setMessage("");

    try {
      const body: Record<string, string> = {
        project_id: action.projectId || DEFAULT_PROJECT_ID,
        decision,
        note: note || fallbackNote,
      };

      body[ACTION_ID_KEY] = action.id;

      const response = await fetch("/api/agi/runtime/actions/decision", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = payload?.error || payload?.message || "No pude completar la decisión.";
        throw new Error(String(error));
      }

      setMessage(
        decision === "approve"
          ? "Aprobado. La acción quedó autorizada, pero no se ejecutó desde este botón."
          : "Listo. La acción fue rechazada o enviada a ajuste."
      );

      setNote("");
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pude completar la decisión.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="mt-5 rounded-[2rem] border border-[var(--hocker-gold)]/40 bg-[var(--hocker-gold)]/[0.07] p-4 shadow-[0_0_40px_rgba(214,168,79,0.12)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-gold)]">
            NOVA necesita tu autorización
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{action.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--hocker-text-soft)]">{action.summary}</p>
        </div>

        <span className={"w-fit rounded-full border px-3 py-1 text-xs font-medium " + riskClass(action.risk)}>
          {riskLabel(action.risk)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">Destino</p>
          <p className="mt-1 text-sm text-white">{action.target}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">Estado</p>
          <p className="mt-1 text-sm text-white">{action.status}</p>
        </div>
      </div>

      <details className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-medium text-cyan-100">
          Ver evidencia de esta acción
        </summary>
        <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--hocker-text-soft)]">
          <p>Responsable: {action.responsible}</p>
          <p>Fecha: {action.createdAt}</p>
          <p>ID: {action.id}</p>
        </div>
      </details>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Nota opcional para aprobar, rechazar o pedir ajuste…"
        className="hocker-focus-ring mt-4 min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--hocker-text-muted)]"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void sendDecision("approve", "Aprobado desde el chat de NOVA.", "approve")}
          className="hocker-focus-ring rounded-2xl border border-[var(--hocker-gold)]/60 bg-[var(--hocker-blue)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "approve" ? "Aprobando..." : "Aprobar"}
        </button>

        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void sendDecision("reject", "Rechazado desde el chat de NOVA.", "reject")}
          className="hocker-focus-ring rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "reject" ? "Rechazando..." : "Rechazar"}
        </button>

        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void sendDecision("reject", "Pedir ajuste antes de autorizar ejecución.", "adjust")}
          className="hocker-focus-ring rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "adjust" ? "Enviando..." : "Pedir ajuste"}
        </button>
      </div>

      {message ? (
        <p className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.045] p-3 text-sm leading-6 text-cyan-50">
          {message}
        </p>
      ) : null}
    </article>
  );
}

export function OwnerNovaInlineApprovals() {
  const [actions, setActions] = useState<OwnerLiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let alive = true;

    setLoading(true);

    loadPendingActions()
      .then((items) => {
        if (!alive) return;
        setActions(items);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const pending = useMemo(
    () => actions.filter((action) => needsOwnerApproval(action.status)).slice(0, 3),
    [actions]
  );

  if (loading || pending.length === 0) return null;

  return (
    <div className="mt-5 space-y-4">
      {pending.map((action) => (
        <NovaInlineApprovalCard key={action.id} action={action} onDone={refresh} />
      ))}
    </div>
  );
}
