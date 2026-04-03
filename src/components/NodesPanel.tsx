"use client";

import { getErrorMessage } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { NodeRow, JsonObject } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

function pill(status: NodeRow["status"]): string {
  if (status === "online") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
  }

  if (status === "degraded") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
  }

  return "border-slate-500/30 bg-white/5 text-slate-300";
}

function safeTime(input: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export default function NodesPanel() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();

  const [items, setItems] = useState<NodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await sb
        .from("nodes")
        .select("id, project_id, name, type, status, last_seen_at, tags, meta, created_at, updated_at")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(60);

      if (queryError) {
        throw queryError;
      }

      setItems(Array.isArray(data) ? (data as NodeRow[]) : []);
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    let channel: RealtimeChannel | null = null;

    channel = sb
      .channel(`nodes-live-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nodes",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const next = payload.new as NodeRow;
          setItems((prev) => {
            const filtered = prev.filter((node) => node.id !== next.id);
            return [next, ...filtered].slice(0, 60);
          });
        },
      )
      .subscribe();

    const refreshTimer = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      window.clearInterval(refreshTimer);
      if (channel) {
        void sb.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, sb]);

  return (
    <section className="hocker-panel-pro overflow-hidden">
      <div className="border-b border-white/5 bg-sky-500/5 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">
              Radar de activos
            </h3>
            <p className="mt-1 text-[10px] text-slate-500">
              Escaneo activo del ecosistema.
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
      </div>

      <div className="p-4">
        {loading && items.length === 0 ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 rounded-[24px] bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-300">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-[11px] text-slate-400">
            Sin nodos activos.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {items.map((node, index) => {
              const meta = isJsonObject(node.meta) ? node.meta : {};
              const isCloud = node.id === "hocker-agi" || node.id.startsWith("cloud-") || node.id.startsWith("trigger-");
              const isOnline = isCloud || node.status === "online";

              return (
                <article
                  key={node.id}
                  className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-slate-950/40 p-5 transition-all duration-300 hover:border-sky-500/30 hover:bg-slate-900/60"
                  style={{ animationDelay: `${index * 35}ms` }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="truncate text-sm font-black text-white group-hover:text-sky-300">
                        {node.name || "Nodo"}
                      </h4>
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${pill(node.status)}`}>
                        {node.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-[10px] font-bold text-slate-500 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-slate-600">ID:</span>
                        <span className="truncate text-slate-300">{node.id}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="uppercase text-slate-600">Tipo:</span>
                        <span className={isCloud ? "text-sky-400/80" : isOnline ? "text-emerald-400/80" : "text-slate-300"}>
                          {node.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:col-span-2">
                        <span className="uppercase text-slate-600">Latido:</span>
                        <span className="text-slate-300">{safeTime(node.last_seen_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/5 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {node.tags?.length ? (
                        node.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300 shadow-inner"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">—</span>
                      )}
                    </div>
                  </div>

                  {Object.keys(meta).length > 0 ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                        Inspeccionar datos
                      </summary>
                      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-inner">
                        <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
                          {JSON.stringify(meta, null, 2)}
                        </pre>
                      </div>
                    </details>
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