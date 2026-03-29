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
  meta: any;
  created_at: string;
  updated_at: string;
};

// Insignias Ring-Inset consistentes con el resto de la plataforma
function pill(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "online") return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20";
  if (s === "degraded") return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20";
  return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-500/20";
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
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar los nodos.");
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
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Malla de Nodos</h2>
          <p className="mt-1 text-sm text-slate-500">Agentes físicos y virtuales conectados al tejido central.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
          )}
          {loading ? "Escaneando..." : "Forzar radar"}
        </button>
      </div>

      {error && (
        <div className="animate-in fade-in rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm flex items-center gap-3">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}

      {!loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <div className="text-slate-400 mb-3">
            <svg className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="text-sm font-bold text-slate-900">Sin nodos detectados</div>
          <div className="mt-1 text-sm text-slate-500 max-w-sm">No hay agentes activos conectados a este proyecto en este momento.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {items.map((node) => (
            <div key={node.id} className="group relative flex flex-col rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                    {node.name || "Agente Desconocido"}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                     <span className="font-mono text-[10px] text-slate-400">ID: {node.id}</span>
                     {node.type && (
                       <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                         {node.type}
                       </span>
                     )}
                  </div>
                </div>
                <div className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${pill(node.status)}`}>
                  {node.status || "offline"}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Última Señal</div>
                  <div className="mt-1 text-sm font-medium text-slate-700">
                    {node.last_seen_at ? new Date(node.last_seen_at).toLocaleString() : "Sin registro"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Etiquetas Operativas</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(node.tags || []).length ? (
                       node.tags.map(tag => (
                         <span key={tag} className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                           {tag}
                         </span>
                       ))
                    ) : (
                      <span className="text-sm font-medium text-slate-400">—</span>
                    )}
                  </div>
                </div>
              </div>

              {node.meta && Object.keys(node.meta || {}).length > 0 && (
                <details className="group/details mt-4">
                  <summary className="cursor-pointer list-none text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 transition-colors hover:text-blue-600">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 transition-transform group-open/details:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      Inspeccionar Metadatos
                    </span>
                  </summary>
                  <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
                    <pre className="p-4 overflow-auto font-mono text-[12px] leading-relaxed text-emerald-300">
                      {JSON.stringify(node.meta, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
