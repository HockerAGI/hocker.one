"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { EventLevel, EventRow } from "@/lib/types";

type FeedItem = EventRow;

function normalizeLevel(level: EventLevel | string | null | undefined): EventLevel {
  const s = String(level ?? "").toLowerCase().trim();
  if (s === "warn" || s === "warning") return "warn";
  if (s === "error" || s === "critical") return "error";
  return "info";
}

function levelBadge(level: EventLevel): string {
  switch (level) {
    case "warn":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "error":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
  }
}

function formatDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
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
        .limit(24);

      if (queryError) throw queryError;

      setItems(
        Array.isArray(data)
          ? (data as FeedItem[]).map((item) => ({
              ...item,
              level: normalizeLevel(item.level),
            }))
          : [],
      );
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
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[24px] border border-white/5 bg-slate-950/50 p-4"
          >
            <div className="h-3 w-32 rounded-full bg-slate-800" />
            <div className="mt-3 h-4 w-full rounded-full bg-slate-800/80" />
            <div className="mt-2 h-4 w-10/12 rounded-full bg-slate-800/60" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-300">
        {error}
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
            Movimientos
          </p>
          <h3 className="mt-2 text-lg font-black text-white sm:text-xl">
            Lo más reciente
          </h3>
        </div>

        <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-300">
          {items.length} items
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-xs text-slate-400">
            Sin actividad por ahora.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="group rounded-[24px] border border-white/5 bg-slate-950/50 p-4 shadow-[0_10px_50px_rgba(2,6,23,0.15)] transition-all duration-300 hover:border-sky-500/20 hover:bg-slate-900/65"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[10px] font-mono text-cyan-400">
                      {item.type}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${levelBadge(
                        item.level,
                      )}`}
                    >
                      {item.level}
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-slate-200">
                    {item.message}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}