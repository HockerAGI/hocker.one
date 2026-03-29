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
  payload: any;
  result: any;
  error: string | null;
};

// Estética Ring-Inset premium para las insignias
function statusPill(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "needs_approval") return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20";
  if (s === "queued") return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20";
  if (s === "running") return "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20";
  if (s === "done") return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20";
  if (s === "error" || s === "failed") return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20";
  if (s === "canceled" || s === "cancelled") return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-500/20";
  return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-500/20";
}

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState<string>(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Cmd[]>([]);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [q, setQ] = useState<string>("");

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("commands")
        .select("id, project_id, node_id, command, status, needs_approval, payload, result, error, created_at, approved_at, executed_at, started_at, finished_at")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(80);

      if (error) throw error;
      setItems((data as Cmd[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cargar la cola.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // 1. Carga inicial
    refresh();

    // 2. Conexión de Espejo en Tiempo Real (WebSockets)
    const channel = sb
      .channel('commands-live')
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha TODO: Creaciones, actualizaciones (aprobaciones) o eliminaciones
          schema: 'public',
          table: 'commands',
          filter: `project_id=eq.${pid}`
        },
        () => {
          // El sistema reacciona instantáneamente a los cambios en la matriz
          refresh();
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  async function approve(id: string) {
    setErr(null);
    try {
      const res = await fetch("/api/commands/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, project_id: pid }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo aprobar.");
      // No necesitamos llamar a refresh() aquí, el WebSocket lo actualizará solo.
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo aprobar.");
    }
  }

  async function reject(id: string) {
    setErr(null);
    try {
      const res = await fetch("/api/commands/reject", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, project_id: pid }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo rechazar.");
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo rechazar.");
    }
  }

  const filtered = useMemo(() => {
    const qs = q.trim().toLowerCase();
    return items.filter((c) => {
      const st = String(c.status || "");
      if (filterStatus !== "all" && st !== filterStatus) return false;
      if (!qs) return true;
      const hay = [c.command, c.id, c.node_id ?? "", JSON.stringify(c.payload ?? {})].join(" ").toLowerCase();
      return hay.includes(qs);
    });
  }, [items, filterStatus, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Orquestador de Comandos</h2>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-inset ring-emerald-600/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Radar Vivo</span>
            </div>
          </div>
          <p className="text-sm text-slate-500">Cola, aprobaciones y logs del Automation Fabric.</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:w-[160px]">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Estado</label>
            <select
              className="mt-1.5 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="needs_approval">Requiere aprobación</option>
              <option value="queued">En cola</option>
              <option value="running">Ejecutando</option>
              <option value="done">Completado</option>
              <option value="error">Error</option>
              <option value="canceled">Cancelado</option>
            </select>
          </div>

          <div className="w-full md:w-[260px]">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Buscar</label>
            <input
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtro por ID, comando, nodo..."
            />
          </div>
        </div>
      </div>

      {err && (
        <div className="animate-in fade-in rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 shadow-sm">
          {err}
        </div>
      )}

      <div className="space-y-3">
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
            <div className="text-slate-400 mb-2">
               <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="text-sm font-medium text-slate-900">Malla despejada</div>
            <div className="text-sm text-slate-500">No hay comandos registrados en este proyecto bajo estos filtros.</div>
          </div>
        )}

        {filtered.map((c) => {
          const canModerate = c.status === "needs_approval";
          return (
            <div key={c.id} className="group flex flex-col rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="truncate text-base font-bold text-slate-900">{c.command}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${statusPill(c.status)}`}>
                      {String(c.status)}
                    </span>
                    {c.needs_approval && (
                      <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm animate-pulse">
                        Acción Requerida
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="rounded-md bg-slate-100 px-2 py-1">Nodo: <b className="text-slate-700">{c.node_id ?? "—"}</b></span>
                    <span>•</span>
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-slate-400">ID: {c.id}</span>
                  </div>

                  {c.error && (
                    <div className="mt-2 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm text-red-800">
                      <b className="font-bold">Falla Operativa:</b> {c.error}
                    </div>
                  )}
                </div>

                {canModerate && (
                  <div className="flex flex-wrap gap-2 md:shrink-0 md:ml-4">
                     <button
                      onClick={() => approve(c.id)}
                      disabled={!canModerate}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] hover:bg-blue-500 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Aprobar AGI
                    </button>
                    <button
                      onClick={() => reject(c.id)}
                      disabled={!canModerate}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-red-50 hover:text-red-700 hover:border-red-200 active:scale-[0.98]"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>

              <details className="group/details mt-4 border-t border-slate-100 pt-3">
                <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-[0.1em] text-slate-500 transition-colors hover:text-blue-600">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 transition-transform group-open/details:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    Inspeccionar Datos (Memoria Syntia)
                  </span>
                </summary>
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                    <div className="border-b border-slate-800 bg-slate-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Payload Entrada</div>
                    <pre className="p-4 overflow-auto font-mono text-[12px] text-blue-300">{JSON.stringify(c.payload ?? null, null, 2)}</pre>
                  </div>
                  <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                    <div className="border-b border-slate-800 bg-slate-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Resultados de Salida</div>
                    <pre className="p-4 overflow-auto font-mono text-[12px] text-emerald-300">{JSON.stringify(c.result ?? null, null, 2)}</pre>
                  </div>
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
