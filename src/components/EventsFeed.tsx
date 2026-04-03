"use client";

import { getErrorMessage } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";
import { normalizeEventLevel, type EventLevel, type EventRow } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

function levelClass(level: EventLevel): string {
  switch (level) {
    case "warn":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "error":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
  }
}

function safeDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function safeData(value: EventRow["data"]): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export default function EventsFeed() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();

  const [items, setItems] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await sb
        .from("events")
        .select("id, project_id, node_id, level, type, message, data, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (queryError) throw queryError;

      const rows = (Array.isArray(data) ? data : []).map((row) => ({
        ...(row as EventRow),
        level: normalizeEventLevel((row as EventRow).level),
      }));

      setItems(rows);
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();

    const channel = sb
      .channel(`events-live-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const next = payload.new as EventRow;
          setItems((prev) => [
            { ...next, level: normalizeEventLevel(next.level) },
            ...prev,
          ].slice(0, 50));
        },
      )
      .subscribe();

    const timer = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      window.clearInterval(timer);
      void sb.removeChannel(channel);
    };
  }, [projectId, sb]);

  return (
    <section className="hocker-panel-pro flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-sky-500/5 p-5">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">
            Telemetría en Vivo
          </h3>
          <p className="mt-1 text-[10px] text-slate-500">
            Radar operativo del proyecto.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-300 transition hover:border-sky-500/30 hover:text-sky-300 active:scale-95"
        >
          Refrescar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading && items.length === 0 ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-300">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-[11px] text-slate-400">
            Sin eventos para mostrar.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((e) => (
              <article
                key={e.id}
                className="rounded-[24px] border border-white/5 bg-slate-950/50 p-4 transition-all duration-300 hover:border-sky-500/20 hover:bg-slate-900/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[11px] font-black uppercase tracking-widest text-white">
                        {e.type}
                      </span>
                      <span className="shrink-0 text-[9px] font-bold text-slate-500">
                        {safeDate(e.created_at)}
                      </span>
                    </div>

                    <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                      {e.message || "Evento registrado sin descripción."}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${levelClass(
                      e.level,
                    )}`}
                  >
                    {e.level}
                  </span>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                    Inspeccionar matriz
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-4 font-mono text-[11px] leading-relaxed text-emerald-300">
                    {safeData(e.data)}
                  </pre>
                </details>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}