"use client";

import { getErrorMessage } from "@/lib/errors";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";

type NodeRow = {
  id: string;
  project_id: string;
  name: string | null;
  type: string;
  status: "online" | "offline" | "degraded" | string;
  last_seen_at: string | null;
  tags: string[];
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function pill(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "online") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
  if (s === "degraded") return "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
  return "border-slate-500/30 bg-white/5 text-slate-300";
}

export default function NodesPanel() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();
  const [items, setItems] = useState<NodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await sb
        .from("nodes")
        .select("*")
        .eq("project_id", projectId)
        .order("name", { ascending: true });
      if (err) throw err;
      setItems((data as NodeRow[]) ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const channel = sb
      .channel("nodes-live-panel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nodes", filter: `project_id=eq.${projectId}` },
        () => load()
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, sb]);

  return (
    <section className="hocker-panel-pro flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-sky-500/5 p-5">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">
          Infraestructura Distribuida
        </h3>
        <div className="flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-sky-400">Monitoreo Activo</span>
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
              Verificando conexión de nodos...
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            Sin nodos asignados a este sector.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {items.map((node, idx) => (
              <article 
                key={node.id} 
                className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-slate-950/40 p-5 transition-all duration-300 hover:border-sky-500/30 hover:bg-slate-900/60 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white group-hover:text-sky-300 transition-colors">
                      {node.name || "NODO_FANTASMA"}
                    </h4>
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${pill(node.status)}`}>
                      {node.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-[10px] font-bold text-slate-500 sm:grid-cols-2">
                    <div className="flex items-center gap-2"><span className="text-slate-600 uppercase">ID:</span> <span className="text-slate-300">{node.id}</span></div>
                    <div className="flex items-center gap-2"><span className="text-slate-600 uppercase">Tipo:</span> <span className="text-sky-400/80">{node.type}</span></div>
                    <div className="col-span-1 sm:col-span-2 flex items-center gap-2"><span className="text-slate-600 uppercase">Latido:</span> <span className="text-slate-300">{node.last_seen_at ? new Date(node.last_seen_at).toLocaleString() : "—"}</span></div>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/5 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {node.tags && node.tags.length > 0 ? (
                      node.tags.map((tag) => (
                        <span key={tag} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300 shadow-inner">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">—</span>
                    )}
                  </div>
                </div>

                {node.meta && Object.keys(node.meta).length > 0 ? (
                  <details className="mt-4 group/details">
                    <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1.5">
                      <svg className="h-3 w-3 transition-transform group-open/details:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      Inspeccionar Matriz
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
