"use client";

import { getErrorMessage } from "@/lib/errors";
import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { CommandStatus } from "@/lib/types";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Cmd = {
  id: string;
  project_id: string;
  node_id: string | null;
  command: string;
  status: CommandStatus;
  needs_approval: boolean;
  created_at: string;
  approved_at: string | null;
  executed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  payload: unknown;
  result: unknown;
  error: string | null;
};

function statusPill(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "needs_approval") return "border-amber-400/30 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
  if (s === "queued") return "border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.2)]";
  if (s === "running") return "border-violet-400/30 bg-violet-500/10 text-violet-300 animate-pulse";
  if (s === "done") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (s === "error" || s === "failed") return "border-rose-400/30 bg-rose-500/10 text-rose-300";
  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [items, setItems] = useState<Cmd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await sb
        .from("commands")
        .select("*")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(30);

      if (err) throw err;
      setItems((data as Cmd[]) ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const channel = sb
      .channel("commands-live-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commands", filter: `project_id=eq.${pid}` },
        () => load()
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, pid]);

  async function approve(id: string, approved: boolean) {
    try {
      const r = await fetch("/api/commands/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, approved }),
      });
      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.error || "Error al procesar la aprobación.");
      }
      load();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <section className="hocker-panel-pro flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">Log de Operaciones</h3>
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Live Sync</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">{error}</div>
        ) : loading ? (
          <div className="p-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 animate-pulse">
            Sincronizando registros...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            No hay operaciones en cola.
          </div>
        ) : (
          items.map((c) => {
            const isPending = c.needs_approval && c.status === "needs_approval";
            return (
              <article key={c.id} className="group rounded-[20px] border border-white/5 bg-slate-950/40 p-4 transition-all hover:bg-slate-900/60 hover:border-sky-500/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                        {c.command}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${statusPill(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      <span>{c.node_id || "global"}</span>
                      <span>•</span>
                      <span>{new Date(c.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => approve(c.id, true)} className="rounded-xl bg-emerald-500/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                        Autorizar
                      </button>
                      <button onClick={() => approve(c.id, false)} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500 hover:text-white transition-all">
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1.5">
                    <svg className="h-3 w-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    Inspeccionar Matriz de Datos
                  </summary>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-slate-950/80 p-4 shadow-inner">
                      <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-sky-500/70">Payload</div>
                      <pre className="overflow-x-auto font-mono text-[11px] text-sky-200 custom-scrollbar">
                        {JSON.stringify(c.payload ?? {}, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/80 p-4 shadow-inner">
                      <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/70">Resultado</div>
                      <pre className="overflow-x-auto font-mono text-[11px] text-emerald-200 custom-scrollbar">
                        {JSON.stringify(c.result ?? {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
