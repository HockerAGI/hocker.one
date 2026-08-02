"use client";

import { getErrorMessage } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { NodeRow, JsonObject } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

const FRESH_HEARTBEAT_MS = 5 * 60 * 1000;

function safeTime(input: string | null): string {
  if (!input) return "Sin señal registrada";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "Fecha inválida" : d.toLocaleString("es-MX");
}

function isFresh(input: string | null, now: number): boolean {
  if (!input) return false;
  const timestamp = new Date(input).getTime();
  return Number.isFinite(timestamp) && now - timestamp <= FRESH_HEARTBEAT_MS;
}

function effectiveStatus(node: NodeRow, now: number): "online" | "warning" | "stale" {
  if (!isFresh(node.last_seen_at, now)) return "stale";
  return node.status === "warning" ? "warning" : "online";
}

function pill(status: "online" | "warning" | "stale"): string {
  if (status === "online") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
  }
  if (status === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
  }
  return "border-slate-500/30 bg-white/5 text-slate-300";
}

function statusLabel(status: "online" | "warning" | "stale"): string {
  if (status === "online") return "Señal reciente";
  if (status === "warning") return "Requiere atención";
  return "Sin señal reciente";
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export default function NodesPanel() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();

  const [items, setItems] = useState<NodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await sb
        .from("nodes")
        .select("id, project_id, name, type, status, last_seen_at, tags, meta, created_at, updated_at")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(60);

      if (queryError) throw queryError;
      setItems(Array.isArray(data) ? (data as NodeRow[]) : []);
      setNow(Date.now());
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, sb]);

  useEffect(() => {
    queueMicrotask(() => { void load(); });

    const refreshTimer = window.setInterval(() => {
      setNow(Date.now());
      void load();
    }, 30_000);

    const channel: RealtimeChannel = sb
      .channel(`nodes:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nodes",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      window.clearInterval(refreshTimer);
      void sb.removeChannel(channel);
    };
  }, [load, projectId, sb]);

  const freshCount = items.filter((node) => effectiveStatus(node, now) !== "stale").length;

  if (loading && items.length === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-[24px] border border-white/5 bg-slate-950/50 p-5">
            <div className="h-4 w-32 rounded-full bg-slate-800" />
            <div className="mt-3 h-4 w-20 rounded-full bg-slate-800/80" />
            <div className="mt-4 h-24 rounded-2xl bg-slate-800/60" />
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
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">Infraestructura</p>
          <h3 className="mt-2 text-lg font-black text-white sm:text-xl">Nodos registrados</h3>
          <p className="mt-1 text-xs text-slate-500">Con señal: heartbeat de los últimos 5 minutos.</p>
        </div>

        <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-300">
          {freshCount}/{items.length} con señal
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-[11px] text-slate-400">
            No hay nodos registrados para este proyecto.
          </div>
        ) : (
          items.map((node, index) => {
            const status = effectiveStatus(node, now);
            return (
              <article
                key={node.id}
                className="group relative overflow-hidden rounded-[24px] border border-white/5 bg-slate-950/40 p-5 transition-all duration-300 hover:border-sky-500/30 hover:bg-slate-900/60"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_40%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="truncate text-sm font-black text-white group-hover:text-sky-300">
                      {node.name || "Nodo sin nombre"}
                    </h4>
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${pill(status)}`}>
                      {statusLabel(status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-[10px] font-bold text-slate-500 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-slate-600">ID:</span>
                      <span className="truncate text-slate-300">{node.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-slate-600">Tipo:</span>
                      <span className="text-sky-400/80">{node.type}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <span className="uppercase text-slate-600">Última señal:</span>
                      <span className="text-slate-300">{safeTime(node.last_seen_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <span className="uppercase text-slate-600">Estado guardado:</span>
                      <span className="text-slate-300">{node.status ?? "sin estado"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/5 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {node.tags?.length ? node.tags.map((tag) => (
                      <span key={tag} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300 shadow-inner">
                        {tag}
                      </span>
                    )) : <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Sin etiquetas</span>}
                  </div>

                  {isJsonObject(node.meta) && Object.keys(node.meta).length > 0 ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                        Ver detalles
                      </summary>
                      <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
                        {JSON.stringify(node.meta, null, 2)}
                      </pre>
                    </details>
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
