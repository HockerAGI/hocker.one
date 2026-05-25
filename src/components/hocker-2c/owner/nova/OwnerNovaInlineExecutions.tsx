"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeOwnerActions, type OwnerLiveAction } from "@/components/hocker-2c/owner/live/owner-live-normalizers";

const ACTION_ID_KEY = "action_id";
const DEFAULT_PROJECT_ID = "hocker-one";

async function loadActions(): Promise<OwnerLiveAction[]> {
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

function isApproved(status: string) {
  const clean = status.toLowerCase();

  return (
    clean.includes("aprobada") ||
    clean === "approved" ||
    clean.includes("approved")
  );
}

function isAlreadyFinal(status: string) {
  const clean = status.toLowerCase();

  return (
    clean.includes("completada") ||
    clean.includes("executed") ||
    clean.includes("revertida") ||
    clean.includes("falló") ||
    clean.includes("fallo") ||
    clean.includes("failed")
  );
}

function safeSummary(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return "Ejecución completada. Revisa evidencia para más detalle.";
}

function NovaInlineExecuteCard({
  action,
  onDone,
}: {
  action: OwnerLiveAction;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");

  async function executeNow() {
    setBusy(true);
    setMessage("");
    setResult("");

    try {
      const body: Record<string, string> = {
        project_id: action.projectId || DEFAULT_PROJECT_ID,
      };

      body[ACTION_ID_KEY] = action.id;

      const response = await fetch("/api/agi/runtime/actions/execute", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = payload?.error || payload?.message || "No pude ejecutar la acción.";
        throw new Error(String(error));
      }

      setMessage("Listo. NOVA ejecutó la acción aprobada y guardó el resultado.");
      setResult(safeSummary(payload));
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pude ejecutar la acción.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="mt-5 rounded-[2rem] border border-emerald-300/35 bg-emerald-300/[0.075] p-4 shadow-[0_0_40px_rgba(52,211,153,0.10)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">
            Acción aprobada
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{action.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--hocker-text-soft)]">
            Esta acción ya fue autorizada. Puedes ejecutarla desde aquí sin moverte del chat.
          </p>
        </div>

        <span className="w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
          Lista para ejecutar
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">Destino</p>
          <p className="mt-1 text-sm text-white">{action.target}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--hocker-text-muted)]">Responsable</p>
          <p className="mt-1 text-sm text-white">{action.responsible}</p>
        </div>
      </div>

      <details className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-medium text-cyan-100">
          Ver evidencia previa
        </summary>
        <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--hocker-text-soft)]">
          <p>Estado: {action.status}</p>
          <p>Fecha: {action.createdAt}</p>
          <p>ID: {action.id}</p>
        </div>
      </details>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => void executeNow()}
          className="hocker-focus-ring rounded-2xl border border-emerald-300/40 bg-emerald-400/20 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:-translate-y-0.5 hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Ejecutando..." : "Ejecutar ahora"}
        </button>

        <a
          href="/owner/evidence"
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-white/15"
        >
          Ver evidencia
        </a>
      </div>

      {message ? (
        <p className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.045] p-3 text-sm leading-6 text-cyan-50">
          {message}
        </p>
      ) : null}

      {result ? (
        <pre className="mt-3 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-3 text-xs leading-6 text-cyan-50">
          {result}
        </pre>
      ) : null}
    </article>
  );
}

export function OwnerNovaInlineExecutions() {
  const [actions, setActions] = useState<OwnerLiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let alive = true;

    setLoading(true);

    loadActions()
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

  const approved = useMemo(
    () => actions
      .filter((action) => isApproved(action.status))
      .filter((action) => !isAlreadyFinal(action.status))
      .slice(0, 3),
    [actions]
  );

  if (loading || approved.length === 0) return null;

  return (
    <div className="mt-5 space-y-4">
      {approved.map((action) => (
        <NovaInlineExecuteCard key={action.id} action={action} onDone={refresh} />
      ))}
    </div>
  );
}
