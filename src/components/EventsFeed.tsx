"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Evt = {
  id: string;
  created_at: string;
  level: "info" | "warn" | "error";
  type: string;
  message: string;
  data: any;
};

export default function EventsFeed() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [items, setItems] = useState<Evt[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data, error } = await sb
        .from("events")
        .select("id, created_at, level, type, message, data")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) setItems(data as Evt[]);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // Refresco automático cada 5 seg
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const getLevelStyles = (level: string) => {
    switch (level) {
      case "error": return "border-red-200 bg-red-50 text-red-900";
      case "warn": return "border-amber-200 bg-amber-50 text-amber-900";
      default: return "border-slate-200 bg-white text-slate-800";
    }
  };

  const getBadgeStyles = (level: string) => {
    switch (level) {
      case "error": return "bg-red-600 text-white";
      case "warn": return "bg-amber-500 text-white";
      default: return "bg-slate-200 text-slate-700";
    }
  };

  return (
    <div className="hocker-card p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registro de Memoria</h2>
          <p className="text-sm text-slate-500">Todo lo que piensa, hace y detecta el sistema en tiempo real.</p>
        </div>
        <div className="w-full md:w-64">
          <label className="text-xs font-semibold text-slate-600">Proyecto</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading && items.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-8">Sincronizando memoria...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-8">La memoria está vacía. Aún no hay eventos registrados.</div>
        ) : (
          items.map((e) => (
            <div key={e.id} className={`flex flex-col gap-2 rounded-xl border p-4 transition-all hover:shadow-md md:flex-row md:items-start ${getLevelStyles(e.level)}`}>
              <div className="flex w-full flex-col gap-1 md:w-48 md:shrink-0">
                <span className="text-xs font-semibold text-slate-500">
                  {new Date(e.created_at).toLocaleString()}
                </span>
                <span className={`inline-flex w-max items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getBadgeStyles(e.level)}`}>
                  {e.level}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-sm font-medium">
                  {e.message || "Evento del sistema registrado sin descripción."}
                </div>
                {e.data && Object.keys(e.data).length > 0 && (
                  <details className="cursor-pointer group">
                    <summary className="text-xs font-semibold text-slate-500 hover:text-blue-600">Ver Datos Técnicos</summary>
                    <pre className="mt-2 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-200 shadow-inner">
                      {JSON.stringify(e.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
