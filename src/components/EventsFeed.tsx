"use client";
import { getErrorMessage } from "@/lib/errors";

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
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("events")
        .select("id, created_at, level, type, message, data")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setItems((data as Evt[]) ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const channel = sb
      .channel("events-live-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events", filter: `project_id=eq.${pid}` },
        () => load()
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  function levelClasses(level: string) {
    switch (level) {
      case "critical":
        return "border-rose-400/20 bg-rose-500/10";
      case "error":
        return "border-orange-400/20 bg-orange-500/10";
      case "warning":
      case "warn":
        return "border-amber-400/20 bg-amber-500/10";
      default:
        return "border-white/10 bg-white/5";
    }
  }

  function badgeClasses(level: string) {
    switch (level) {
      case "critical":
        return "border-rose-400/20 bg-rose-500/10 text-rose-200";
      case "error":
        return "border-orange-400/20 bg-orange-500/10 text-orange-200";
      case "warning":
      case "warn":
        return "border-amber-400/20 bg-amber-500/10 text-amber-200";
      default:
        return "border-white/10 bg-white/5 text-slate-200";
    }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur-2xl">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">Registro de Memoria</h2>
          <p className="mt-1 text-sm text-slate-400">Radar cronológico conectado al espejo central.</p>
        </div>
        <input
          className="hocker-input w-52"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Filtrar por proyecto"
        />
      </div>

      <div className="space-y-3">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-12 text-sm text-slate-300">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-sky-400" />
            <span className="ml-3">Sincronizando memoria central...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-12 text-center text-sm text-slate-300">
            Aún no hay eventos registrados en este canal.
          </div>
        ) : (
          items.map((e) => (
            <div key={e.id} className={`rounded-[20px] border p-5 ${levelClasses(e.level)}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex w-full flex-col gap-2 md:w-48 md:shrink-0">
                  <span className={`inline-flex w-max items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${badgeClasses(e.level)}`}>
                    {e.level}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    <span className="block font-normal lowercase">{new Date(e.created_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <div className="flex-1">
                  <div className="text-[15px] font-medium leading-relaxed text-slate-100">
                    {getErrorMessage(e) || "Evento del sistema registrado sin descripción."}
                  </div>

                  {e.data && Object.keys(e.data).length > 0 ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                        Inspeccionar matriz de datos
                      </summary>
                      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
                        <pre className="overflow-auto p-4 font-mono text-[12px] leading-relaxed text-emerald-200">
                          {JSON.stringify(e.data, null, 2)}
                        </pre>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}