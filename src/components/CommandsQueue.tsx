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
  payload: any;
  result: any;
  error: string | null;
};

function statusPill(status: CommandStatus) {
  switch (status) {
    case "needs_approval":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "queued":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "running":
      return "bg-purple-50 text-purple-800 border-purple-200";
    case "done":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "failed":
      return "bg-red-50 text-red-800 border-red-200";
    case "cancelled":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);

  const [projectId, setProjectId] = useState<string>(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Cmd[]>([]);

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("commands")
        .select(
          "id, project_id, node_id, command, status, needs_approval, payload, result, error, created_at, approved_at, executed_at"
        )
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(60);

      if (error) throw error;
      setItems((data as Cmd[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cargar la cola de comandos.");
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900">Commands</div>
          <div className="text-sm text-slate-500">Cola + aprobaciones (filtrado por proyecto).</div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="w-full md:w-[320px]">
            <label className="text-xs font-semibold text-slate-600">Project</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="global"
            />
          </div>

          <button
            onClick={refresh}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
      )}

      <div className="space-y-3">
        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {!loading && items.length === 0 && (
          <div className="text-sm text-slate-500">No hay comandos para este proyecto.</div>
        )}

        {items.map((c) => {
          const canModerate = c.status === "needs_approval";
          return (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{c.command}</span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusPill(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                    {c.needs_approval && (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        needs_approval
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500">
                    <span className="font-semibold">project:</span> {c.project_id} ·{" "}
                    <span className="font-semibold">node:</span> {c.node_id ?? "—"} ·{" "}
                    {new Date(c.created_at).toLocaleString()}
                  </div>

                  {c.error && (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {c.error}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => approve(c.id)}
                    disabled={!canModerate}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(c.id)}
                    disabled={!canModerate}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">Payload / Result</summary>
                <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-1 text-xs font-semibold text-slate-600">payload</div>
                    <pre className="overflow-auto text-xs text-slate-800">{JSON.stringify(c.payload ?? null, null, 2)}</pre>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-1 text-xs font-semibold text-slate-600">result</div>
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