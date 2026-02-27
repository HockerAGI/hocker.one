"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type NodeRow = {
  id: string;
  project_id: string;
  name: string | null;
  type: string;
  status: string;
  last_seen_at: string | null;
  meta: any;
  created_at: string;
};

function ago(ts: string | null) {
  if (!ts) return "—";
  const d = new Date(ts).getTime();
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

function pill(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "online") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (s === "degraded") return "border-amber-200 bg-amber-50 text-amber-800";
  if (s === "offline") return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function NodesPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [rows, setRows] = useState<NodeRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("nodes")
        .select("id,project_id,name,type,status,last_seen_at,meta,created_at")
        .eq("project_id", pid)
        .order("last_seen_at", { ascending: false })
        .limit(300);

      if (error) throw error;
      setRows((data ?? []) as any);
    } catch (e: any) {
      setMsg(e?.message ?? "No pude cargar nodos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((n) => {
      const s = String(n.status || "").toLowerCase();
      if (status !== "all" && s !== status) return false;
      if (!query) return true;
      const hay = [n.id, n.name ?? "", n.type ?? "", n.meta?.hostname ?? "", n.meta?.platform ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [rows, q, status]);

  const stats = useMemo(() => {
    const by: Record<string, number> = { online: 0, degraded: 0, offline: 0, other: 0 };
    for (const n of rows) {
      const s = String(n.status || "").toLowerCase();
      if (s === "online") by.online++;
      else if (s === "degraded") by.degraded++;
      else if (s === "offline") by.offline++;
      else by.other++;
    }
    return by;
  }, [rows]);

  return (
    <PageShell
      title="Nodos"
      subtitle="Lista de máquinas/agents conectados. Si el agente físico está corriendo, debe aparecer aquí."
      actions={
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Cargando…" : "Recargar"}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-6">
        <div className="hocker-card p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Online: {stats.online}
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Degraded: {stats.degraded}
              </span>
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
                Offline: {stats.offline}
              </span>
              {stats.other ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  Otros: {stats.other}
                </span>
              ) : null}
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-end">
              <div className="w-full md:w-56">
                <label className="text-xs font-semibold text-slate-600">Proyecto</label>
                <input
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="global"
                />
              </div>

              <div className="w-full md:w-64">
                <label className="text-xs font-semibold text-slate-600">Buscar</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="ID, nombre, hostname…"
                />
              </div>

              <div className="w-full md:w-40">
                <label className="text-xs font-semibold text-slate-600">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="online">Online</option>
                  <option value="degraded">Degraded</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
          </div>

          {msg ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {msg}
            </div>
          ) : null}

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3">Nodo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Visto</th>
                  <th className="px-4 py-3">Host</th>
                  <th className="px-4 py-3">Plataforma</th>
                  <th className="px-4 py-3">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((n) => (
                  <tr key={n.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{n.name || n.id}</div>
                      <div className="text-xs text-slate-500">ID: {n.id} · Tipo: {n.type || "agent"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${pill(n.status)}`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{ago(n.last_seen_at)}</div>
                      <div className="text-xs text-slate-500">{n.last_seen_at ? new Date(n.last_seen_at).toLocaleString() : "—"}</div>
                    </td>
                    <td className="px-4 py-3">{n.meta?.hostname ?? "—"}</td>
                    <td className="px-4 py-3">{n.meta?.platform ?? "—"}</td>
                    <td className="px-4 py-3">
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-blue-700 hover:underline">Ver</summary>
                        <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-emerald-200">
{JSON.stringify(n.meta ?? {}, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      No hay nodos para este proyecto. Cuando corra el agente, aparecerá aquí.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-slate-600">
            <b>Tip rápido:</b> si quieres que el nodo se marque Online, el agent debe mandar heartbeat actualizando <code className="hocker-kbd">nodes.last_seen_at</code>.
          </div>
        </div>
      </div>
    </PageShell>
  );
}
