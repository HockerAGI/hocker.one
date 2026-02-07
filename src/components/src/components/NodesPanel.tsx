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
      .select("id,name,status,last_seen_at,meta")
      .eq("project_id", pid)
      .order("last_seen_at", { ascending: false })
      .limit(20);

    setRows((data as any) ?? []);
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
          <h2 className="text-sm font-semibold text-slate-900">Nodos</h2>
          <p className="text-sm text-slate-500">Quién está vivo y cuándo se vio por última vez.</p>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-slate-500">Proyecto</label>
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </div>
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-500">Sin nodos aún. (Se llena cuando el Agent hace heartbeat)</div>
        ) : (
          <div className="space-y-2">
            {rows.map((n) => (
              <div key={n.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{n.name}</div>
                  <div className="text-xs text-slate-600">{n.status}</div>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  last_seen: {n.last_seen_at ? new Date(n.last_seen_at).toLocaleString() : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}