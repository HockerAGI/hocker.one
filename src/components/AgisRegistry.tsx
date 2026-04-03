"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { AgiRow, JsonObject } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

function isAgiRow(value: unknown): value is AgiRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const row = value as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    (typeof row.name === "string" || row.name === null) &&
    (typeof row.description === "string" || row.description === null) &&
    (typeof row.version === "string" || row.version === null) &&
    Array.isArray(row.tags) &&
    (typeof row.meta === "object" || row.meta === null) &&
    typeof row.created_at === "string"
  );
}

function asMeta(value: unknown): JsonObject | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return null;
}

export default function AgisRegistry({ title = "Células Operativas" }: { title?: string }) {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [agents, setAgents] = useState<AgiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await sb
        .from("agis")
        .select("id, name, description, version, tags, meta, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (queryError) {
        throw queryError;
      }

      const rows = Array.isArray(data) ? data.filter(isAgiRow) : [];
      setAgents(rows);
    } catch (err: unknown) {
      setAgents([]);
      setError(err instanceof Error ? err.message : "No se pudo cargar el registro.");
    } finally {
      setLoading(false);
    }
  }, [sb]);

  useEffect(() => {
    void load();

    const channel: RealtimeChannel = sb
      .channel("agis-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agis",
        },
        () => {
          void load();
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
  }, [load, sb]);

  return (
    <section className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between px-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">
          {title}
        </h3>
        <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="text-[10px] text-slate-500 animate-pulse">Escaneando AGIs...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-300">
            {error}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-[10px] text-slate-600">No hay AGIs registradas en este sector.</div>
        ) : (
          agents.map((agi) => {
            const meta = asMeta(agi.meta);
            const loadPercent =
              meta && typeof meta.load === "string" && meta.load.trim() ? meta.load.trim() : "0%";

            return (
              <article
                key={agi.id}
                className="hocker-panel-pro border-white/5 p-4 transition-all hover:border-sky-500/30"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-black text-white">
                      {agi.name ?? agi.id}
                    </span>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                      {agi.description ?? "AGI de registro."}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                    activo
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">CARGA COGNITIVA</span>
                    <span className="text-sky-400">{loadPercent}</span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                    <div
                      className="h-full bg-sky-500 shadow-[0_0_10px_#0ea5ff]"
                      style={{ width: loadPercent }}
                    />
                  </div>

                  {agi.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {agi.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wider text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}