import { getErrorMessage } from "@/lib/errors";
"use client";

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
  if (s === "needs_approval") return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  if (s === "queued") return "border-sky-400/20 bg-sky-500/10 text-sky-200";
  if (s === "running") return "border-violet-400/20 bg-violet-500/10 text-violet-200";
  if (s === "done") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
  if (s === "error" || s === "failed") return "border-rose-400/20 bg-rose-500/10 text-rose-200";
  if (s === "canceled" || s === "cancelled") return "border-slate-400/20 bg-white/5 text-slate-200";
  return "border-slate-400/20 bg-white/5 text-slate-200";
}

function normalizeStatus(status: string): string {
  const s = String(status || "").toLowerCase();
  return s === "canceled" ? "cancelled" : s;
}

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState<string>(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Cmd[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [q, setQ] = useState("");

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      let query = sb
        .from("commands")
        .select(
          "id, project_id, node_id, command, status, needs_approval, payload, result, error, created_at, approved_at, executed_at, started_at, finished_at"
        )
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(80);

      if (filterStatus !== "all") query = query.eq("status", normalizeStatus(filterStatus));
      const { data, error } = await query;
      if (error) throw error;
      setItems((data as Cmd[]) ?? []);
    } catch (e: unknown) {
      setErr(e?getErrorMessage() ?? "No se pudo cargar la cola.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const channel = sb
      .channel("commands-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commands", filter: `project_id=eq.${pid}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, filterStatus]);

  async function approve(id: string) {
    setErr(null);
    try {
      const res = await fetch("/api/commands/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: pid, id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? "No se pudo aprobar.");
      await refresh();
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    }
  }

  async function reject(id: string) {
    setErr(null);
    try {
      const res = await fetch("/api/commands/reject", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: pid, id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? "No se pudo rechazar.");
      await refresh();
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    }
  }

  const shown = items.filter((c) => {
    const hay = `${c.command} ${c.node_id ?? ""} ${JSON.stringify(c.payload ?? {})}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur-2xl">
      <div className="flex flex-col gap-4 border-b border-white/5 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">Cola de Ejecución</h2>
          <p className="mt-1 text-sm text-slate-400">Aprobaciones, estados y despachos en tiempo real.</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <input className="hocker-input w-full sm:w-52" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
          <select
            className="hocker-input w-full sm:w-44"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="needs_approval">Pendientes</option>
            <option value="queued">En cola</option>
            <option value="running">En ejecución</option>
            <option value="done">Completados</option>
            <option value="error">Con error</option>
            <option value="cancelled">Cancelados</option>
          </select>
          <input
            className="hocker-input w-full sm:w-56"
            placeholder="Buscar comando, nodo o payload..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {err ? <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{err}</div> : null}

      <div className="mt-6 space-y-3">
        {loading && items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            Cargando cola...
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            No hay comandos para mostrar.
          </div>
        ) : (
          shown.map((c) => {
            const s = normalizeStatus(c.status);
            return (
              <article key={c.id} className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-white">{c.command}</h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${statusPill(s)}`}
                      >
                        {s}
                      </span>
                      {c.needs_approval ? (
                        <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                          approval
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm text-slate-400">
                      Nodo: <span className="text-slate-200">{c.node_id || "—"}</span> · Creado:{" "}
                      {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {c.status === "needs_approval" ? (
                      <>
                        <button onClick={() => approve(c.id)} className="hocker-button-primary">
                          Aprobar
                        </button>
                        <button onClick={() => reject(c.id)} className="hocker-button-secondary">
                          Rechazar
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Inspeccionar datos
                  </summary>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Payload</div>
                      <pre className="overflow-auto font-mono text-[12px] leading-relaxed text-sky-200">
                        {JSON.stringify(c.payload ?? null, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Resultado</div>
                      <pre className="overflow-auto font-mono text-[12px] leading-relaxed text-emerald-200">
                        {JSON.stringify(c.result ?? null, null, 2)}
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