"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type NodeRow = {
  id: string;
  name: string;
  status: string;
  last_seen_at: string | null;
  meta: any;
  tags?: string[];
};

export default function NodesPanel() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [rows, setRows] = useState<NodeRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("nodes")
      .select("id,name,status,last_seen_at,meta,tags")
      .eq("project_id", pid)
      .order("last_seen_at", { ascending: false })
      .limit(20);

    setRows((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Polling relajado a 5s ya que en la nube no requerimos agresividad
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Infraestructura Zero-Trust</h2>
          <p className="text-sm text-slate-500">Nodos físicos y virtuales (Automation Fabric).</p>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-slate-500">Proyecto</label>
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </div>
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando telemetría...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-500">Sin nodos en la matriz. Ejecuta comandos o conecta un túnel.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((n) => {
              const isCloud = n.meta?.engine === "trigger.dev" || n.tags?.includes("cloud");
              return (
                <div key={n.id} className={`rounded-xl border p-3 ${isCloud ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{n.name}</div>
                        {isCloud && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">FABRIC CLOUD</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${n.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                        <div className="text-xs text-slate-600 font-medium">{n.status.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>último latido: {n.last_seen_at ? new Date(n.last_seen_at).toLocaleString() : "permanente"}</span>
                    <span>{n.meta?.trust_level ? `trust: ${n.meta.trust_level}` : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}