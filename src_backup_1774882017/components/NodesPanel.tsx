"use client";

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
  meta: unknown;
  created_at: string;
  updated_at: string;
};

function pill(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "online") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  if (s === "degraded") return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  return "border-slate-400/20 bg-white/5 text-slate-200";
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
      const { data, error } = await sb
        .from("nodes")
        .select("id,project_id,name,type,status,last_seen_at,tags,meta,created_at,updated_at")
        .eq("project_id", projectId)
        .order("last_seen_at", { ascending: false });
      if (error) throw error;
      setItems((data as NodeRow[]) || []);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "No se pudieron cargar los nodos.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Malla de Nodos</h2>
            <p className="mt-1 text-sm text-slate-400">Agentes físicos y virtuales conectados al tejido central.</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="hocker-button-primary"
          >
            {loading ? "Escaneando..." : "Forzar radar"}
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-200">
            {error}
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/5 py-16 text-center">
            <div className="mb-3 text-sm font-bold text-white">Sin nodos detectados</div>
            <div className="mx-auto max-w-sm text-sm text-slate-400">No hay agentes activos conectados a este proyecto en este momento.</div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {items.map((node) => (
              <article key={node.id} className="rounded-[20px] border border-white/10 bg-white/5 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-400/20 hover:bg-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-black tracking-tight text-white">
                      {node.name || "Agente Desconocido"}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">ID: {node.id}</span>
                      {node.type ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                          {node.type}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${pill(node.status)}`}>
                    {node.status || "offline"}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Última Señal</div>
                    <div className="mt-1 text-sm font-medium text-slate-200">
                      {node.last_seen_at ? new Date(node.last_seen_at).toLocaleString() : "Sin registro"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Etiquetas Operativas</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(node.tags || []).length ? (
                        node.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] font-semibold text-slate-300">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm font-medium text-slate-500">—</span>
                      )}
                    </div>
                  </div>
                </div>

                {node.meta && Object.keys(node.meta || {}).length > 0 ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer list-none text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        Inspeccionar Metadatos
                      </span>
                    </summary>
                    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
                      <pre className="overflow-auto p-4 font-mono text-[12px] leading-relaxed text-emerald-200">
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