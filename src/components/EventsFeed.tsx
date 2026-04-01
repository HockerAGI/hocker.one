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
  data: Record<string, unknown> | null;
};

export default function EventsFeed() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId] = useState(defaultProjectId());
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
    } catch (err: unknown) {
      console.error("[NOVA] Fallo en telemetría:", getErrorMessage(err));
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
        (payload) => {
          setItems((prev) => [payload.new as Evt, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, pid]);

  return (
    <section className="hocker-panel-pro flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-sky-500/5 p-5">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">
          Telemetría en Vivo
        </h3>
        <div className="flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-sky-400">Sync Activa</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <span className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-sky-500">
              Escaneando red...
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            Sin señales detectadas
          </div>
        ) : (
          items.map((e) => {
            const isCritical = e.level === "error" || e.level === "critical";
            const isWarn = e.level === "warn" || e.level === "warning";
            const _color = isCritical ? "rose" : isWarn ? "amber" : "sky";

            return (
              <div
                key={e.id}
                className={`group relative overflow-hidden rounded-2xl border bg-slate-950/40 p-4 transition-all hover:bg-slate-900/80 animate-in fade-in slide-in-from-left-2 ${
                  isCritical ? "border-rose-500/20 hover:border-rose-500/40" : 
                  isWarn ? "border-amber-500/20 hover:border-amber-500/40" : 
                  "border-white/5 hover:border-sky-500/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-2 w-2 shrink-0 rounded-full shadow-[0_0_8px_currentColor] ${
                    isCritical ? "bg-rose-500 text-rose-500" : 
                    isWarn ? "bg-amber-500 text-amber-500" : 
                    "bg-sky-500 text-sky-500"
                  }`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-black uppercase tracking-widest text-white">
                        {e.type}
                      </span>
                      <span className="shrink-0 text-[9px] font-bold text-slate-500">
                        {new Date(e.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="mt-1 text-[12px] leading-relaxed text-slate-300">
                      {e.message || "Evento registrado sin descripción."}
                    </div>

                    {e.data && Object.keys(e.data).length > 0 ? (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-sky-400 transition-colors">
                          Inspeccionar Matriz
                        </summary>
                        <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-inner">
                          <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
                            {JSON.stringify(e.data, null, 2)}
                          </pre>
                        </div>
                      </details>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
