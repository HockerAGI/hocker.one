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

function pill(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "online") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "degraded") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
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
        .select("id, project_id, name, type, status, last_seen_at, tags, meta, created_at, updated_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setItems((data as NodeRow[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar la lista de nodos.");
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
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Nodos</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Puntos de control del ecosistema
          </h2>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Actualizar
        </button>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        Proyecto activo: <span className="font-semibold text-slate-900">{projectId}</span>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Cargando nodos...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No hay nodos registrados para este proyecto.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {items.map((node) => (
              <div key={node.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black tracking-tight text-slate-950">
                      {node.name || node.id}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                      {node.type || "agent"}
                    </div>
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] ${pill(node.status)}`}>
                    {node.status || "offline"}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-900">ID:</span> {node.id}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Última señal:</span>{" "}
                    {node.last_seen_at ? new Date(node.last_seen_at).toLocaleString() : "sin señal"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Etiquetas:</span>{" "}
                    {(node.tags || []).length ? node.tags.join(", ") : "sin etiquetas"}
                  </div>
                </div>

                {node.meta && Object.keys(node.meta || {}).length > 0 ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                      Ver metadatos
                    </summary>
                    <pre className="mt-2 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-emerald-200">
                      {JSON.stringify(node.meta, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
