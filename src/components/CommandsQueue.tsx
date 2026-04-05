"use client";

import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { CommandRow, CommandStatus, JsonObject } from "@/lib/types";
import { normalizeCommandStatus } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

type QueueItem = CommandRow;

function statusClasses(status: CommandStatus): string {
  switch (status) {
    case "needs_approval":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "running":
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
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

function statusLabel(status: CommandStatus): string {
  switch (status) {
    case "needs_approval":
      return "Pendiente";
    case "running":
      return "En curso";
    case "done":
      return "Listo";
    case "error":
      return "Error";
    case "canceled":
      return "Cancelado";
    default:
      return "En cola";
  }
}

function safeDate(input: string): string {
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

function asJsonObject(value: unknown): JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
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

      const rows = Array.isArray(data)
        ? (data as QueueItem[]).map((row) => ({
            ...row,
            status: normalizeCommandStatus(row.status),
          }))
        : [];

      setItems(rows);
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, sb]);

  useEffect(() => {
    void load();

    const channel: RealtimeChannel = sb
      .channel(`commands:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "commands",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [load, projectId, sb]);

  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[24px] border border-white/5 bg-slate-950/50 p-4"
          >
            <div className="h-3 w-32 rounded-full bg-slate-800" />
            <div className="mt-3 h-4 w-full rounded-full bg-slate-800/80" />
            <div className="mt-2 h-4 w-10/12 rounded-full bg-slate-800/60" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
            Cola operativa
          </p>
          <h3 className="mt-2 text-lg font-black text-white sm:text-xl">
            Comandos recientes
          </h3>
        </div>

        <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-300">
          {items.length} items
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-xs text-slate-400">
            Sin comandos pendientes.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="group rounded-[24px] border border-white/5 bg-slate-950/50 p-4 shadow-[0_10px_50px_rgba(2,6,23,0.15)] transition-all duration-300 hover:border-sky-500/20 hover:bg-slate-900/65"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[10px] font-mono text-cyan-400">
                      {item.command}
                    </p>
                    {item.needs_approval ? (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-amber-300">
                        Aprobación
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-[11px] text-slate-400">
                    Nodo: <span className="text-slate-200">{item.node_id}</span>
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {safeDate(item.created_at)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${statusClasses(
                    item.status,
                  )}`}
                >
                  {statusLabel(item.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Creado
                  </p>
                  <p className="mt-1 text-xs text-slate-200">{safeDate(item.created_at)}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Aprobado
                  </p>
                  <p className="mt-1 text-xs text-slate-200">{item.approved_at ? safeDate(item.approved_at) : "—"}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Terminado
                  </p>
                  <p className="mt-1 text-xs text-slate-200">
                    {item.finished_at ? safeDate(item.finished_at) : "—"}
                  </p>
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                  Inspeccionar carga
                </summary>
                <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-inner">
                  <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
                    {safePayload(asJsonObject(item.payload))}
                  </pre>
                </div>
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
    </section>
  );
}