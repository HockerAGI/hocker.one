"use client";

import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { EventRow, EventLevel, JsonObject } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

type FeedItem = EventRow;

function normalizeLevel(level: EventLevel | string | null | undefined): EventLevel {
  const s = String(level ?? "").toLowerCase().trim();
  if (s === "warn" || s === "warning") return "warn";
  if (s === "error") return "error";
  if (s === "critical") return "critical";
  return "info";
}

function levelClasses(level: EventLevel): string {
  switch (level) {
    case "warn":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "error":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300";
    case "critical":
      return "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export default function EventsFeed() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await sb
        .from("events")
        .select("id, project_id, node_id, level, type, message, data, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (queryError) {
        throw queryError;
      }

      const rows = Array.isArray(data) ? (data as FeedItem[]) : [];
      setItems(rows);
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    let channel: RealtimeChannel | null = null;

    const subscribe = () => {
      channel = sb
        .channel(`events-live-feed-${projectId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "events",
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            const next = payload.new as FeedItem;
            setItems((prev) => [next, ...prev].slice(0, 50));
          },
        )
        .subscribe();
    };

    subscribe();

    const refreshTimer = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      window.clearInterval(refreshTimer);
      if (channel) {
        void sb.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded-2xl bg-white/5" />
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
            {items.map((e, index) => {
              const level = normalizeLevel(e.level);
              const stamp = new Date(e.created_at);
              const hasData = isJsonObject(e.data) && Object.keys(e.data).length > 0;

              return (
                <article
                  key={e.id}
                  className="group rounded-[24px] border border-white/5 bg-slate-950/50 p-4 transition-all duration-300 hover:border-sky-500/20 hover:bg-slate-900/60"
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[11px] font-black uppercase tracking-widest text-white">
                          {e.type}
                        </span>
                        <span className="shrink-0 text-[9px] font-bold text-slate-500">
                          {Number.isNaN(stamp.getTime()) ? "—" : stamp.toLocaleTimeString("es-MX")}
                        </span>
                      </div>

                      <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                        {e.message || "Evento registrado sin descripción."}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${levelClasses(level)}`}
                    >
                      {level}
                    </span>
                  </div>

                  {hasData ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                        Inspeccionar matriz
                      </summary>
                      <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-inner">
                        <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
                          {JSON.stringify(e.data, null, 2)}
                        </pre>
                      </div>
                    </details>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}