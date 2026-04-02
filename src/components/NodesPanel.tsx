"use client";

import { getErrorMessage } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { NodeRow } from "@/lib/types";
import { useEffect, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

function pill(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "online") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
  if (s === "degraded") return "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
  return "border-slate-500/30 bg-white/5 text-slate-300";
}

function safeTime(input: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function NodesPanel() {
  const { projectId } = useWorkspace();
  const [items, setItems] = useState<NodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let sb: SupabaseClient | null = null;
    let channel: RealtimeChannel | null = null;

    const load = async () => {
      if (!sb) return;

      try {
        const { data, error: err } = await sb
          .from("nodes")
          .select("id, project_id, name, type, status, last_seen_at, tags, meta, created_at, updated_at")
          .eq("project_id", projectId)
          .order("name", { ascending: true });

        if (err) throw err;
        if (!alive) return;

        setItems((data as NodeRow[]) ?? []);
        setError(null);
      } catch (err: unknown) {
        if (!alive) return;
        setItems([]);
        setError(getErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    };

    try {
      sb = createBrowserSupabase();
    } catch (err: unknown) {
      setLoading(false);
      setError(getErrorMessage(err));
      return;
    }

    void load();

    channel = sb
      .channel(`nodes-live-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nodes", filter: `project_id=eq.${projectId}` },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      alive = false;
      if (channel) {
        void sb?.removeChannel(channel);
      }
    };
  }, [projectId]);

  return (
    <section className="hocker-panel-pro flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-sky-500/5 p-5">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">
          Infraestructura
        </h3>
        <div className="flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-sky-400">
            Monitoreo activo
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-[11px] font-bold uppercase tracking-wide text-rose-300">
            {error}
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center">
            <span className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Verificando nodos...
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            Sin nodos en este proyecto.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {items.map((node, index) => (
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
                      <span className="text-sky-400/80">{node.type}</span>
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

                {node.meta && Object.keys(node.meta).length > 0 ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                      Inspeccionar datos
                    </summary>
                    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-inner">
                      <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
                        {JSON.stringify(node.meta, null, 2)}
                      </pre>
                    </div>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}