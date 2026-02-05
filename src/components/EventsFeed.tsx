"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Ev = {
  id: string;
  created_at: string;
  project_id: string;
  node_id?: string | null;
  level: "info" | "warn" | "error";
  event_type: string;
  message: string;
  details: any;
};

export default function EventsFeed() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [nodeId, setNodeId] = useState("");
  const [items, setItems] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  const [manualLevel, setManualLevel] = useState<"info" | "warn" | "error">("info");
  const [manualType, setManualType] = useState("manual.note");
  const [manualMsg, setManualMsg] = useState("");

  async function load() {
    setLoading(true);

    let q = supabase
      .from("events")
      .select("id, created_at, project_id, node_id, level, event_type, message, details")
      .eq("project_id", pid)
      .order("created_at", { ascending: false })
      .limit(50);

    if (nodeId.trim()) q = q.eq("node_id", nodeId.trim());

    const { data, error } = await q;
    if (!error) setItems((data ?? []) as any);

    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, nodeId]);

  async function sendManual() {
    const message = manualMsg.trim();
    if (!message) return;

    await fetch("/api/events/manual", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        project_id: pid,
        node_id: nodeId.trim() || null,
        level: manualLevel,
        event_type: manualType,
        message,
        details: {},
      }),
    });

    setManualMsg("");
    load();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Eventos</h2>
          <p className="text-sm text-slate-500">Bitácora del sistema (avisos, errores, acciones).</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">Proyecto</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="global / chido / supply..."
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-slate-500">Filtrar por Node (opcional)</label>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="node-hocker-01"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 p-3">
        <div className="text-sm font-semibold text-slate-900">Evento manual</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={manualLevel}
            onChange={(e) => setManualLevel(e.target.value as any)}
          >
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
          </select>

          <input
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm min-w-[220px]"
            value={manualType}
            onChange={(e) => setManualType(e.target.value)}
            placeholder="event_type"
          />

          <input
            className="flex-[2] rounded-xl border border-slate-200 px-3 py-2 text-sm min-w-[260px]"
            value={manualMsg}
            onChange={(e) => setManualMsg(e.target.value)}
            placeholder="mensaje"
          />

          <button
            onClick={sendManual}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Enviar
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500">No hay eventos en este proyecto.</div>
        ) : (
          <div className="space-y-2">
            {items.map((e) => (
              <div key={e.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">{new Date(e.created_at).toLocaleString()}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {e.event_type} <span className="text-xs text-slate-500">{e.node_id ? `(${e.node_id})` : ""}</span>
                    </span>
                    <span className="text-xs text-slate-500">Proyecto: {e.project_id}</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {e.level}
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-700">{e.message}</div>

                {e.details && Object.keys(e.details).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-slate-600">Ver detalles</summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-800">
                      {JSON.stringify(e.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}