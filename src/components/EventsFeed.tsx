"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Evt = {
  id: string;
  created_at: string;
  level: "info" | "warn" | "error" | "warning" | "critical";
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
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 1. Carga inicial
    load();

    // 2. Conexión de Espejo en Tiempo Real (WebSockets)
    const channel = sb
      .channel('events-live-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Solo escuchamos cuando nace un nuevo evento
          schema: 'public',
          table: 'events',
          filter: `project_id=eq.${pid}`
        },
        () => {
          // Cuando llega un aviso de la matriz, recargamos la lista al instante
          load();
        }
      )
      .subscribe();

    // Limpieza al salir de la pantalla
    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const getLevelStyles = (level: string) => {
    switch (level) {
      case "critical":
        return "border-red-200 bg-gradient-to-r from-red-50 to-white";
      case "error":
        return "border-orange-200 bg-gradient-to-r from-orange-50 to-white";
      case "warning":
      case "warn":
        return "border-amber-200 bg-gradient-to-r from-amber-50 to-white";
      default:
        return "border-slate-200 bg-white hover:border-slate-300";
    }
  };

  const getBadgeStyles = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20";
      case "error":
        return "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20";
      case "warning":
      case "warn":
        return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20";
      default:
        return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-500/20";
    }
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Registro de Memoria</h2>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-inset ring-emerald-600/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Reflejo Instantáneo</span>
            </div>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">Radar cronológico. Conectado al espejo central sin retrasos.</p>
        </div>
        
        <div className="w-full md:w-64 shrink-0">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Filtrar por Proyecto</label>
          <input
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-slate-500">Sincronizando memoria central...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
            <div className="text-slate-400 mb-2">
              <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="text-sm font-medium text-slate-900">Memoria vacía</div>
            <div className="text-sm text-slate-500">Aún no hay eventos registrados en este canal.</div>
          </div>
        ) : (
          items.map((e) => (
            <div
              key={e.id}
              className={`group flex flex-col gap-3 rounded-[20px] border p-5 transition-all duration-300 md:flex-row md:items-start ${getLevelStyles(e.level)}`}
            >
              <div className="flex w-full flex-col gap-2 md:w-48 md:shrink-0 md:pt-1">
                <span className={`inline-flex w-max items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${getBadgeStyles(e.level)}`}>
                  {e.level}
                </span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  <span className="block font-normal lowercase">{new Date(e.created_at).toLocaleDateString()}</span>
                </span>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="text-[15px] font-medium leading-relaxed text-slate-900">{e.message || "Evento del sistema registrado sin descripción."}</div>
                {e.data && Object.keys(e.data).length > 0 && (
                  <details className="cursor-pointer group/details">
                    <summary className="list-none text-xs font-bold uppercase tracking-[0.1em] text-slate-500 transition-colors hover:text-blue-600">
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 transition-transform group-open/details:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        Inspeccionar Matriz de Datos
                      </span>
                    </summary>
                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
                      <pre className="p-4 overflow-auto font-mono text-[12px] leading-relaxed text-emerald-300">
                        {JSON.stringify(e.data, null, 2)}
                      </pre>
                    </div>
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
