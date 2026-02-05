"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Cmd = {
  id: string;
  created_at: string;
  project_id: string;
  node_id: string;
  command: string;
  status: string;
  payload: any;
  result?: any;
  error?: string | null;
};

export default function CommandsQueue() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [items, setItems] = useState<Cmd[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("commands")
      .select("id, created_at, project_id, node_id, command, status, payload, result, error")
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

  async function approve(id: string) {
    await fetch("/api/commands/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, project_id: pid })
    });
    load();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cola de comandos</h2>
          <p className="text-sm text-slate-500">Pendientes, corriendo y resultados (por proyecto).</p>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-slate-500">Proyecto</label>
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="global / chido / supply..."
          />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500">No hay comandos en este proyecto.</div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleString()}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {c.command} <span className="text-xs text-slate-500">({c.node_id})</span>
                    </span>
                    <span className="text-xs text-slate-500">Proyecto: {c.project_id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {c.status}
                    </span>

                    {c.status === "needs_approval" && (
                      <button
                        onClick={() => approve(c.id)}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Aprobar
                      </button>
                    )}
                  </div>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-slate-600">Ver payload / resultado</summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-800">
                    {JSON.stringify({ payload: c.payload, result: c.result, error: c.error }, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}