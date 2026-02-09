"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { EventLevel } from "@/lib/types";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Ev = {
  id: string;
  project_id: string;
  node_id: string | null;
  level: EventLevel;
  type: string;
  message: string;
  data: any;
  created_at: string;
};

function levelBadge(level: EventLevel) {
  switch (level) {
    case "info":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "warn":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "error":
      return "bg-red-50 text-red-800 border-red-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function EventsFeed() {
  const sb = useMemo(() => createBrowserSupabase(), []);

  const [projectId, setProjectId] = useState<string>(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [items, setItems] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Manual event form
  const [nodeId, setNodeId] = useState<string>("");
  const [level, setLevel] = useState<EventLevel>("info");
  const [type, setType] = useState<string>("manual");
  const [message, setMessage] = useState<string>("");

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("events")
        .select("id, project_id, node_id, level, type, message, data, created_at")
        .eq("project_id", pid)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setItems((data as Ev[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudieron cargar los eventos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  async function submitManual() {
    setErr(null);
    try {
      const res = await fetch("/api/events/manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: pid,
          node_id: nodeId || null,
          level,
          type,
          message,
          data: null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo crear el evento.");
      setMessage("");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo crear el evento.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900">Events</div>
          <div className="text-sm text-slate-500">Feed de eventos (filtrado por proyecto).</div>
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

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-slate-900">Emit manual event</div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="text-xs font-semibold text-slate-600">node</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="(optional)"
            />
          </div>

          <div className="md:col-span-1">
            <label className="text-xs font-semibold text-slate-600">level</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={level}
              onChange={(e) => setLevel(e.target.value as EventLevel)}
            >
              <option value="info">info</option>
              <option value="warn">warn</option>
              <option value="error">error</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">type</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="manual"
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-xs font-semibold text-slate-600">message</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe el evento…"
            />
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={submitManual}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            disabled={!message.trim()}
          >
            Emit
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading && <div className="text-sm text-slate-500">Loading…</div>}
        {!loading && items.length === 0 && <div className="text-sm text-slate-500">No hay eventos para este proyecto.</div>}

        {items.map((ev) => (
          <div key={ev.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${levelBadge(ev.level)}`}>
                    {ev.level}
                  </span>

                  <span className="text-sm font-semibold text-slate-900">{ev.type}</span>

                  <span className="text-xs text-slate-500">{new Date(ev.created_at).toLocaleString()}</span>
                </div>

                <div className="text-sm text-slate-800">{ev.message}</div>

                <div className="text-xs text-slate-500">
                  <span className="font-semibold">project:</span> {ev.project_id} ·{" "}
                  <span className="font-semibold">node:</span> {ev.node_id ?? "—"}
                </div>
              </div>
            </div>

            {ev.data && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">data</summary>
                <pre className="mt-2 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                  {JSON.stringify(ev.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}