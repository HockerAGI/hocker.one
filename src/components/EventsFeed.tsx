"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { EventLevel, EventRow, JsonObject } from "@/lib/types";

type FeedItem = EventRow;

function normalizeLevel(level: EventLevel | string | null | undefined): EventLevel {
  const s = String(level ?? "").toLowerCase().trim();
  if (s === "warn" || s === "warning") return "warn";
  if (s === "error" || s === "critical") return "error";
  return "info";
}

function levelClasses(level: EventLevel): string {
  switch (level) {
    case "warn":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "error":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function safeData(data: unknown): JsonObject {
  return isJsonObject(data) ? data : {};
}

export default function EventsFeed() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
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

      const rows = Array.isArray(data)
        ? (data as FeedItem[]).map((row) => ({
            ...row,
            level: normalizeLevel(row.level),
          }))
        : [];

      setItems(rows);
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, sb]);

  useEffect(() => {
    void load();

    const channel: RealtimeChannel = sb
      .channel(`events:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [load, projectId, sb]);

  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[24px] border border-white/5 bg-slate-950/50 p-4"
          >
            <div className="h-3 w-28 rounded-full bg-slate-800" />
            <div className="mt-3 h-4 w-full rounded-full bg-slate-800/80" />
            <div className="mt-2 h-4 w-11/12 rounded-full bg-slate-800/60" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
            Telemetría
          </p>
          <h3 className="mt-2 text-lg font-black text-white sm:text-xl">
            Eventos en vivo
          </h3>
        </div>

        <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-300">
          {items.length} registros
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-[11px] text-slate-400">
            Sin eventos para mostrar.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((e) => (
              <article
                key={e.id}
                className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-slate-950/50 p-4 transition-all duration-300 hover:border-sky-500/20 hover:bg-slate-900/60"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_40%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[11px] font-black uppercase tracking-widest text-white">
                        {e.type}
                      </span>
                      <span className="shrink-0 text-[9px] font-bold text-slate-500">
                        {formatDate(e.created_at)}
                      </span>
                    </div>

                    <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                      {e.message || "Evento registrado sin descripción."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {e.node_id ? (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                          Nodo: {e.node_id}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                        {e.project_id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${levelClasses(
                      e.level,
                    )}`}
                  >
                    {e.level}
                  </span>
                </div>

                <details className="relative mt-4">
                  <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                    Inspeccionar matriz
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
                    {JSON.stringify(safeData(e.data), null, 2)}
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