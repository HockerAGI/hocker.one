"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { CommandStatus } from "@/lib/types";
import { useWorkspace } from "@/components/WorkspaceContext";
import Hint from "@/components/Hint";

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
  payload: any;
  result: any;
  error: string | null;
};

function statusPill(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "needs_approval") return "bg-amber-50 text-amber-800 border-amber-200";
  if (s === "queued") return "bg-blue-50 text-blue-800 border-blue-200";
  if (s === "running") return "bg-purple-50 text-purple-800 border-purple-200";
  if (s === "done") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s === "error" || s === "failed") return "bg-red-50 text-red-800 border-red-200";
  if (s === "canceled" || s === "cancelled") return "bg-slate-50 text-slate-700 border-slate-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId: pid } = useWorkspace();

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
        .select("id, project_id, node_id, command, status, needs_approval, payload, result, error, created_at, approved_at, executed_at")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(80);

      if (error) throw error;
      setItems((data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cargar la cola.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
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
      await refresh();
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
      await refresh();
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
    <div className="hocker-card p-6 space-y-4">
      <Hint title="Qué estás viendo">
        Esta es la cola real del proyecto <b>{pid}</b>. Si una acción dice <b>needs_approval</b>, debes aprobarla.
      </Hint>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900">Cola de acciones</div>
          <div className="text-sm text-slate-500">Proyecto activo: <b>{pid}</b></div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="w-full md:w-[220px]">
            <label className="text-xs font-semibold text-slate-600">Filtrar por estado</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="needs_approval">needs_approval</option>
              <option value="queued">queued</option>
              <option value="running">running</option>
              <option value="done">done</option>
              <option value="error">error</option>
              <option value="failed">failed</option>
              <option value="canceled">canceled</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>

          <div className="w-full md:w-[320px]">
            <label className="text-xs font-semibold text-slate-600">Buscar</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="command, id, node…"
            />
          </div>

          <button
            onClick={refresh}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        </div>
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

      <div className="space-y-3">
        {!loading && filtered.length === 0 && <div className="text-sm text-slate-500">No hay comandos en este proyecto.</div>}

        {filtered.map((c) => {
          const canModerate = String(c.status) === "needs_approval";
          return (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-slate-900">{c.command}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusPill(c.status)}`}>
                      {String(c.status)}
                    </span>
                    {c.needs_approval && (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        requiere aprobación
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500">
                    Nodo: <b>{c.node_id ?? "—"}</b> · {new Date(c.created_at).toLocaleString()} · ID: {c.id}
                  </div>

                  {c.error && (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      <b>Falla:</b> {c.error}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => approve(c.id)}
                    disabled={!canModerate}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => reject(c.id)}
                    disabled={!canModerate}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ver datos</summary>
                <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-1 text-xs font-bold text-slate-600">Payload</div>
                    <pre className="overflow-auto text-xs text-slate-800">{JSON.stringify(c.payload ?? null, null, 2)}</pre>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-1 text-xs font-bold text-slate-600">Resultado</div>
                    <pre className="overflow-auto text-xs text-slate-800">{JSON.stringify(c.result ?? null, null, 2)}</pre>
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