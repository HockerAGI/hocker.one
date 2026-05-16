"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { CommandRow, CommandStatus } from "@/lib/types";
import { normalizeCommandStatus } from "@/lib/types";
import StatusBadge from "@/components/ui-hocker/StatusBadge";

type QueueItem = CommandRow;

const FILTERS: Array<{ value: "all" | CommandStatus; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "needs_approval", label: "Revisión" },
  { value: "running", label: "En curso" },
  { value: "done", label: "Listas" },
  { value: "error", label: "Con error" },
];

function safeDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function safePayload(value: unknown): string {
  try { return JSON.stringify(value ?? {}, null, 2); } catch { return "{}"; }
}

function friendlyCommand(value: string): string {
  const clean = value.replace(/^github\./i, "").replace(/_/g, " ").trim();
  if (!clean) return "Tarea";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | CommandStatus>("all");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await sb
        .from("commands")
        .select("id, project_id, node_id, command, payload, status, needs_approval, signature, result, error, approved_at, executed_at, started_at, finished_at, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(48);
      if (queryError) throw queryError;
      setItems(Array.isArray(data) ? (data as QueueItem[]).map((row) => ({ ...row, status: normalizeCommandStatus(row.status) })) : []);
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, sb]);

  useEffect(() => {
    void load();
    const channel: RealtimeChannel = sb.channel(`commands:${projectId}`).on("postgres_changes", { event: "*", schema: "public", table: "commands", filter: `project_id=eq.${projectId}` }, () => void load()).subscribe();
    return () => { void sb.removeChannel(channel); };
  }, [load, projectId, sb]);

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
    <section className="hko-module-card space-y-5">
      <div>
        <p className="hko-kicker">Seguimiento</p>
        <h3 className="mt-2 text-xl font-black text-white">Tareas</h3>
        <p className="mt-2 text-sm text-slate-400">Qué falta, qué está en curso y qué ya quedó cerrado.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="hko-mini-stat"><span>Revisión</span><strong>{stats.pending}</strong></div>
        <div className="hko-mini-stat"><span>En curso</span><strong>{stats.running}</strong></div>
        <div className="hko-mini-stat"><span>Listas</span><strong>{stats.done}</strong></div>
        <div className="hko-mini-stat"><span>Error</span><strong>{stats.errors}</strong></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={filter === item.value ? "hko-action-primary" : "hko-action-secondary"}>{item.label}</button>)}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? <p className="rounded-2xl border border-white/8 bg-slate-950/45 p-4 text-sm text-slate-500">No hay tareas en esta vista.</p> : filtered.map((item) => (
          <details key={item.id} className="rounded-[24px] border border-white/8 bg-slate-950/45 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">{friendlyCommand(item.command)}</p>
                <p className="mt-1 text-xs text-slate-500">{safeDate(item.created_at)}</p>
              </div>
              <StatusBadge status={item.status} compact />
            </summary>
            <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Detalles técnicos</p>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-300">{safePayload({ id: item.id, node_id: item.node_id, payload: item.payload, result: item.result, error: item.error })}</pre>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
