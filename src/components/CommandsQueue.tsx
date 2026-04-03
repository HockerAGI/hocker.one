"use client";

import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { CommandRow, CommandStatus, JsonObject } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useEffect, useMemo, useState } from "react";

type QueueItem = CommandRow;

function statusClasses(status: CommandStatus): string {
  switch (status) {
    case "needs_approval":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "running":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-300";
    case "done":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "failed":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300";
    case "cancelled":
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeDate(input: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();

  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
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
  }

  useEffect(() => {
    void load();

    const timer = window.setInterval(() => {
      void load();
    }, 20000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, sb]);

  return (
    <section className="hocker-panel-pro flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-sky-500/5 p-5">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">
            Cola de comandos
          </h3>
          <p className="mt-1 text-[10px] text-slate-500">
            Órdenes operativas del núcleo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-300 transition hover:border-sky-500/30 hover:text-sky-300 active:scale-95"
        >
          Refrescar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading && items.length === 0 ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-300">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-[11px] text-slate-400">
            Sin comandos pendientes.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item, index) => {
              const payload = isJsonObject(item.payload) ? item.payload : {};
              const result = isJsonObject(item.result) ? item.result : null;

              return (
                <article
                  key={item.id}
                  className="group rounded-[24px] border border-white/5 bg-slate-950/50 p-4 transition-all duration-300 hover:border-sky-500/20 hover:bg-slate-900/60"
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[11px] font-black uppercase tracking-widest text-white">
                          {item.command}
                        </p>
                        <p className="shrink-0 text-[9px] font-bold text-slate-500">
                          {safeDate(item.created_at)}
                        </p>
                      </div>

                      <p className="mt-2 text-[11px] text-slate-400">
                        Nodo: <span className="text-slate-200">{item.node_id}</span>
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${statusClasses(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Aprobación
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-200">
                        {item.needs_approval ? "Requiere revisión" : "Liberado"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Firma
                      </p>
                      <p className="mt-1 truncate text-[11px] font-mono text-slate-200">
                        {item.signature ?? "—"}
                      </p>
                    </div>
                  </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                      Inspeccionar carga
                    </summary>

                    <div className="mt-2 space-y-3">
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-inner">
                        <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
                          {JSON.stringify(payload, null, 2)}
                        </pre>
                      </div>

                      {result ? (
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-inner">
                          <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed text-sky-300 custom-scrollbar">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  </details>

                  {item.error ? (
                    <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] leading-relaxed text-rose-300">
                      {item.error}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}