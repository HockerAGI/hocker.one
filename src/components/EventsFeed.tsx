"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Ev = {
  id: string;
  created_at: string;
  project_id: string;
  node_id?: string | null;
  level: "info" | "warn" | "error" | "critical";
  type: string;
  message: string;
  data: any;
};

export default function EventsFeed() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [items, setItems] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("id, created_at, project_id, node_id, level, type, message, data")
      .eq("project_id", pid)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) setItems((data ?? []) as any);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Eventos</h2>
          <p className="text-sm text-slate-500">Bitácora del sistema.</p>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-slate-500">Proyecto</label>
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500">No hay eventos.</div>
        ) : (
          <div className="space-y-2">
            {items.map((e) => (
              <div key={e.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">{new Date(e.created_at).toLocaleString()}</span>
                    <span className="text-sm font-semibold text-slate-900">{e.type}</span>
                    <span className="text-xs text-slate-500">{e.node_id ? `Node: ${e.node_id}` : ""}</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {e.level}
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-700">{e.message}</div>

                {e.data && Object.keys(e.data).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-slate-600">Ver data</summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">
                      {JSON.stringify(e.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}