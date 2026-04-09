"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { NodeRow } from "@/lib/types";

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

      if (queryError) throw queryError;

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

    const channel: RealtimeChannel = sb
      .channel(`nodes:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nodes",
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
  }, [projectId, sb]);

  if (loading && items.length === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[24px] border border-white/5 bg-slate-950/50 p-5"
          >
            <div className="h-4 w-32 rounded-full bg-slate-800" />
            <div className="mt-3 h-4 w-20 rounded-full bg-slate-800/80" />
            <div className="mt-4 h-24 rounded-2xl bg-slate-800/60" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-300">
        {error}
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
            Equipo
          </p>
          <h3 className="mt-2 text-lg font-black text-white sm:text-xl">
            Nodos en vivo
          </h3>
        </div>

        <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-300">
          {items.length} activos
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-[11px] text-slate-400">
            No hay nodos visibles por ahora.
          </div>
        ) : (
          items.map((node, index) => (
            <article
              key={node.id}
              className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-slate-950/40 p-5 transition-all duration-300 hover:border-sky-500/30 hover:bg-slate-900/60"
              style={{ animationDelay: `${index * 35}ms` }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_40%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="truncate text-sm font-black text-white group-hover:text-sky-300">
                    {node.name || "Equipo"}
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
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      —
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}