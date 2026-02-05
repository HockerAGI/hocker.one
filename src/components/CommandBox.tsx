"use client";

import { useMemo, useState } from "react";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

export default function CommandBox() {
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [nodeId, setNodeId] = useState(process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID ?? "node-hocker-01");
  const [text, setText] = useState("status");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);

  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  async function send() {
    setLoading(true);
    setOut(null);
    try {
      const r = await fetch("/api/commands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project_id: pid, node_id: nodeId, command: text, payload: {} })
      });
      const j = await r.json().catch(() => ({}));
      setOut(j);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2 items-end">
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
          <label className="text-xs text-slate-500">Node</label>
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-[220px]">
          <label className="text-xs text-slate-500">Comando</label>
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="status / fs.list / shell.exec"
          />
        </div>

        <button
          onClick={send}
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </div>

      {out && (
        <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-800">
          {JSON.stringify(out, null, 2)}
        </pre>
      )}
    </div>
  );
}