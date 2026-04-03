"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { CommandRow, CommandStatus } from "@/lib/types";

type QueueItem = CommandRow;

function statusClasses(status: CommandStatus): string {
  switch (status) {
    case "needs_approval":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "running":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
    case "done":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "error":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300";
    case "canceled":
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
  }
}

function safeDate(input: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function safePayload(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();

  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await sb
        .from("commands")
        .select(
          "id, project_id, node_id, command, payload, status, needs_approval, signature, result, error, approved_at, executed_at, started_at, finished_at, created_at",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(24);

      if (queryError) {
        throw queryError;
      }

      setItems(Array.isArray(data) ? (data as QueueItem[]) : []);
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, sb]);

  useEffect(() => {
    void load();

    const channel = sb
      .channel(`commands-live-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "commands",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const next = payload.new as QueueItem;
          setItems((prev) => {
            const filtered = prev.filter((item) => item.id !== next.id);
            return [next, ...filtered].slice(0, 24);
          });
        },
      )
      .subscribe();

    const timer = window.setInterval(() => {
      void load();
    }, 20000);

    return () => {
      window.clearInterval(timer);
      void sb.removeChannel(channel);
    };
  }, [load, projectId, sb]);

  if (loading && items.length === 0) {
    return <div className="p-4 text-xs text-slate-500 animate-pulse">Sincronizando cola de comandos...</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-slate-400">
          Sin comandos pendientes.
        </div>
      ) : (
        items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-sm backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-mono text-cyan-400">{item.command}</p>
              <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${statusClasses(item.status)}`}>
                {item.status}
              </span>
            </div>

            <p className="mt-2 text-[11px] text-slate-400">
              Nodo: <span className="text-slate-200">{item.node_id}</span>
            </p>

            <p className="mt-2 text-[11px] text-slate-400">
              {safeDate(item.created_at)}
            </p>

            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                Inspeccionar carga
              </summary>
              <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-4 font-mono text-[11px] leading-relaxed text-emerald-300">
                {safePayload(item.payload)}
              </pre>
            </details>

            {item.error ? (
              <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] leading-relaxed text-rose-300">
                {item.error}
              </div>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}