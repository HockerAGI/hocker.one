"use client";

import { useMemo, useState } from "react";
import { defaultNodeId, defaultProjectId, normalizeProjectId } from "@/lib/project";

export default function CommandBox() {
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [nodeId, setNodeId] = useState(defaultNodeId());
  const [command, setCommand] = useState("status");
  const [payload, setPayload] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);

  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  async function send() {
    setLoading(true);
    setOut(null);
    try {
      const body = {
        project_id: pid,
        node_id: nodeId,
        command,
        payload: JSON.parse(payload || "{}")
      };

      const r = await fetch("/api/commands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const j = await r.json().catch(() => ({}));
      setOut(j);
    } catch (e: any) {
      setOut({ ok: false, error: String(e?.message ?? e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Comando rápido</h2>
        <span className="text-xs text-slate-500">Manual (sin NOVA)</span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Proyecto" />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={nodeId} onChange={(e) => setNodeId(e.target.value)} placeholder="Node" />
        </div>

        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="status / fs.list / fs.read / fs.write / shell.exec" />
        <textarea className="min-h-[90px] rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs" value={payload} onChange={(e) => setPayload(e.target.value)} />

        <button
          onClick={send}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar"}
        </button>

        {out && (
          <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">
            {JSON.stringify(out, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}