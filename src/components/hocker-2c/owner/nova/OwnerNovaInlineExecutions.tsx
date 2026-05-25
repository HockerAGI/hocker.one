"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  normalizeOwnerActions,
  normalizeOwnerEvidence,
  type OwnerEvidenceRecord,
  type OwnerLiveAction,
} from "@/components/hocker-2c/owner/live/owner-live-normalizers";

const ACTION_ID_KEY = "action_id";
const DEFAULT_PROJECT_ID = "hocker-one";

type DetailItem = {
  label: string;
  value: string;
};

type ExecutionViewState = {
  title: string;
  summary: string;
  status: "success" | "failed" | "unknown";
  rollbackAvailable: boolean;
  items: DetailItem[];
  details: string;
  evidence: OwnerEvidenceRecord[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "No pude convertir los detalles técnicos.";
  }
}

function readString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function deepFindString(value: unknown, wantedKeys: string[], depth = 0): string {
  if (depth > 5) return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = deepFindString(item, wantedKeys, depth + 1);
      if (found) return found;
    }
    return "";
  }

  if (!isRecord(value)) return "";

  const normalizedWanted = wantedKeys.map((key) => key.toLowerCase());

  for (const [key, item] of Object.entries(value)) {
    if (normalizedWanted.includes(key.toLowerCase())) {
      const text = readString(item);
      if (text) return text;
    }
  }

  for (const item of Object.values(value)) {
    const found = deepFindString(item, wantedKeys, depth + 1);
    if (found) return found;
  }

  return "";
}

function deepHasTruthyKey(value: unknown, wantedKeys: string[], depth = 0): boolean {
  if (depth > 5) return false;

  if (Array.isArray(value)) {
    return value.some((item) => deepHasTruthyKey(item, wantedKeys, depth + 1));
  }

  if (!isRecord(value)) return false;

  const normalizedWanted = wantedKeys.map((key) => key.toLowerCase());

  for (const [key, item] of Object.entries(value)) {
    if (normalizedWanted.includes(key.toLowerCase())) {
      if (item === null || item === undefined || item === false || item === "") return false;
      return true;
    }
  }

  return Object.values(value).some((item) => deepHasTruthyKey(item, wantedKeys, depth + 1));
}

function payloadLooksSuccessful(payload: unknown) {
  const raw = safeJson(payload).toLowerCase();

  return (
    raw.includes('"ok": true') ||
    raw.includes('"status": "executed"') ||
    raw.includes('"status":"executed"') ||
    raw.includes('"success"') ||
    raw.includes('"completed"')
  );
}

function readError(payload: unknown) {
  return (
    deepFindString(payload, ["error", "message", "execution_error", "last_error"]) ||
    "No pude ejecutar la acción."
  );
}

function compactItems(items: DetailItem[]) {
  return items.filter((item) => item.value && item.value !== "undefined" && item.value !== "null");
}

function summarizeExecutionPayload(payload: unknown): ExecutionViewState {
  const operation = deepFindString(payload, ["operation", "action_type", "type"]) || "acción aprobada";
  const repository = deepFindString(payload, ["repository", "full_name", "repo"]);
  const branch = deepFindString(payload, ["target_branch", "branch", "head"]);
  const path = deepFindString(payload, ["path", "file_path"]);
  const commit = deepFindString(payload, ["commit_sha", "sha", "head_sha"]);
  const url = deepFindString(payload, ["html_url", "url", "pr_url"]);
  const worker = deepFindString(payload, ["worker"]);
  const idempotency = deepFindString(payload, ["idempotency_key"]);

  const success = payloadLooksSuccessful(payload);
  const rollbackAvailable = deepHasTruthyKey(payload, ["rollback_plan"]);

  const items = compactItems([
    { label: "Operación", value: operation },
    { label: "Repositorio", value: repository },
    { label: "Rama", value: branch },
    { label: "Archivo", value: path },
    { label: "Commit / SHA", value: commit },
    { label: "URL", value: url },
    { label: "Worker", value: worker },
    { label: "Idempotencia", value: idempotency },
    { label: "Rollback", value: rollbackAvailable ? "Disponible" : "No registrado" },
  ]);

  return {
    title: success ? "Acción ejecutada" : "Ejecución revisada",
    summary: success
      ? "Listo. NOVA ejecutó la acción aprobada y guardó el resultado disponible."
      : readError(payload),
    status: success ? "success" : "unknown",
    rollbackAvailable,
    items,
    details: safeJson(payload),
    evidence: [],
  };
}

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

async function loadRecentEvidence(): Promise<OwnerEvidenceRecord[]> {
  const urls = [
    "/api/agi/runtime/actions?project_id=hocker-one&status=executed&limit=8",
    "/api/agi/runtime/actions?status=executed&limit=8",
    "/api/agi/runtime/memory/publication-audit?limit=8",
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

      const evidence = normalizeOwnerEvidence(payload);
      if (evidence.length > 0) return evidence.slice(0, 3);
    } catch {
      // Keep fallback chain.
    }
  }

  return [];
}

function isApproved(status: string) {
  const clean = status.toLowerCase();

  return clean.includes("aprobada") || clean === "approved" || clean.includes("approved");
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

function ResultPanel({ result }: { result: ExecutionViewState }) {
  const statusClass =
    result.status === "success"
      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-50"
      : "border-amber-300/30 bg-amber-300/10 text-amber-50";

  return (
    <section className={"mt-4 rounded-[1.5rem] border p-4 " + statusClass}>
      <p className="text-xs uppercase tracking-[0.24em] opacity-75">Resultado</p>
      <h4 className="mt-2 text-lg font-semibold text-white">{result.title}</h4>
      <p className="mt-2 text-sm leading-6 opacity-85">{result.summary}</p>

      {result.items.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {result.items.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.2em] opacity-60">{item.label}</p>
              <p className="mt-1 break-words text-sm text-white">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {result.rollbackAvailable ? (
        <p className="mt-4 rounded-2xl border border-[var(--hocker-gold)]/30 bg-[var(--hocker-gold)]/10 p-3 text-sm leading-6 text-amber-100">
          Rollback disponible. Revisa la evidencia antes de revertir cualquier cambio.
        </p>
      ) : null}

      {result.evidence.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.2em] opacity-60">Evidencia reciente</p>
          <div className="mt-3 space-y-2">
            {result.evidence.map((record) => (
              <div key={record.id} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                <p className="text-sm font-medium text-white">{record.title}</p>
                <p className="mt-1 text-xs leading-5 opacity-75">{record.summary}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 opacity-80">
          No encontré evidencia reciente visible todavía. Puede tardar unos segundos en aparecer.
        </p>
      )}

      <details className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
        <summary className="cursor-pointer text-sm font-medium text-cyan-100">
          Ver detalles técnicos
        </summary>
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-6 text-cyan-50">
          {result.details}
        </pre>
      </details>
    </section>
  );
}

function NovaInlineExecuteCard({
  action,
  onDone,
}: {
  action: OwnerLiveAction;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExecutionViewState | null>(null);

  async function executeNow() {
    setBusy(true);
    setResult(null);

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
        throw new Error(readError(payload));
      }

      const summary = summarizeExecutionPayload(payload);
      const evidence = await loadRecentEvidence();

      setResult({
        ...summary,
        evidence,
      });
    } catch (error) {
      setResult({
        title: "No pude ejecutar la acción",
        summary: error instanceof Error ? error.message : "La ejecución falló sin mostrar detalle claro.",
        status: "failed",
        rollbackAvailable: false,
        items: [
          { label: "Acción", value: action.title },
          { label: "Estado anterior", value: action.status },
        ],
        details: error instanceof Error ? error.message : "Error desconocido",
        evidence: [],
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="mt-5 rounded-[2rem] border border-emerald-300/35 bg-emerald-300/[0.075] p-4 shadow-[0_0_40px_rgba(52,211,153,0.10)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">Acción aprobada</p>
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
        <summary className="cursor-pointer text-sm font-medium text-cyan-100">Ver evidencia previa</summary>
        <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--hocker-text-soft)]">
          <p>Estado: {action.status}</p>
          <p>Fecha: {action.createdAt}</p>
          <p>ID: {action.id}</p>
        </div>
      </details>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={busy || Boolean(result)}
          onClick={() => void executeNow()}
          className="hocker-focus-ring rounded-2xl border border-emerald-300/40 bg-emerald-400/20 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:-translate-y-0.5 hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Ejecutando..." : result ? "Ejecutada" : "Ejecutar ahora"}
        </button>

        <button
          type="button"
          onClick={onDone}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-white/15"
        >
          Actualizar estado
        </button>

        <a
          href="/owner/evidence"
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-white/15"
        >
          Ver evidencia
        </a>
      </div>

      {result ? <ResultPanel result={result} /> : null}
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
    () =>
      actions
        .filter((action) => isApproved(action.status))
        .filter((action) => !isAlreadyFinal(action.status))
        .slice(0, 3),
    [actions],
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
