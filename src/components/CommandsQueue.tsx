"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { CommandRow, CommandStatus } from "@/lib/types";
import { normalizeCommandStatus } from "@/lib/types";
import StatusBadge from "@/components/ui-hocker/StatusBadge";
import { humanCommandLabel } from "@/lib/hocker-human-labels";

type QueueItem = CommandRow;
type CommandsResponse = {
  items?: unknown[];
  error?: string;
};

const FILTERS: Array<{ value: "all" | CommandStatus; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "needs_approval", label: "Revisión" },
  { value: "running", label: "En curso" },
  { value: "done", label: "Listas" },
  { value: "error", label: "Histórico" },
];

function safeDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function safePayload(value: unknown): string {
  try { return JSON.stringify(value ?? {}, null, 2); } catch { return "{}"; }
}

function friendlyCommand(value: string): string {
  return humanCommandLabel(value);
}

export default function CommandsQueue() {
  const { projectId } = useWorkspace();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | CommandStatus>("all");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/commands?project_id=${encodeURIComponent(projectId)}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as CommandsResponse;
      if (!res.ok) {
        throw new Error(data.error || "No se pudo leer la cola de tareas.");
      }

      const rows = Array.isArray(data.items) ? data.items : [];
      setItems(
        rows.map((row) => {
          const item = row as QueueItem;
          return { ...item, status: normalizeCommandStatus(item.status) };
        }),
      );
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
    const intervalId = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(intervalId);
  }, [load]);

  const filtered = filter === "all" ? items : items.filter((item) => item.status === filter);
  const stats = useMemo(() => ({
    pending: items.filter((item) => item.status === "needs_approval").length,
    running: items.filter((item) => item.status === "running").length,
    done: items.filter((item) => item.status === "done").length,
    errors: items.filter((item) => item.status === "error").length,
  }), [items]);

  if (loading && items.length === 0) return <div className="hko-module-card text-sm text-slate-400">Cargando tareas...</div>;
  if (error) return <div className="rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-200">{error}</div>;

  return (
    <section className="hko-module-card space-y-4">
      <div>
        <p className="hko-kicker">Seguimiento</p>
        <h3 className="mt-2 text-xl font-black text-white">Tareas</h3>
        <p className="mt-2 text-sm text-slate-400">Qué falta, qué está en curso y qué ya quedó cerrado.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="hko-mini-stat"><span>Revisión</span><strong>{stats.pending}</strong></div>
        <div className="hko-mini-stat"><span>En curso</span><strong>{stats.running}</strong></div>
        <div className="hko-mini-stat"><span>Listas</span><strong>{stats.done}</strong></div>
        <div className="hko-mini-stat"><span>Histórico</span><strong>{stats.errors}</strong></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={filter === item.value ? "hko-action-primary" : "hko-action-secondary"}>{item.label}</button>)}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? <p className="rounded-2xl border border-white/8 bg-slate-950/45 p-4 text-sm text-slate-500">No hay tareas en esta vista.</p> : filtered.map((item) => (
          <details key={item.id} className="rounded-[22px] border border-white/8 bg-slate-950/45 p-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{friendlyCommand(item.command)}</p>
                <p className="mt-1 text-xs text-slate-500">{safeDate(item.created_at)}</p>
              </div>
              <StatusBadge status={item.status} compact />
            </summary>
            <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Detalle guardado</p>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-300">{safePayload({ id: item.id, node_id: item.node_id, payload: item.payload, result: item.result, error: item.error })}</pre>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
