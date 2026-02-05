"use client";

import { useEffect, useState } from "react";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

export default function CommandBox() {
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [nodeId, setNodeId] = useState("node-hocker-01");
  const [command, setCommand] = useState("PING");
  const [payload, setPayload] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hocker_project_id");
      if (stored) setProjectId(normalizeProjectId(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("hocker_project_id", projectId);
    } catch {}
  }, [projectId]);

  async function submit() {
    setMsg(null);
    setLoading(true);

    let p: any = {};
    try {
      p = payload ? JSON.parse(payload) : {};
    } catch {
      setLoading(false);
      setMsg("Payload JSON inválido");
      return;
    }

    const r = await fetch("/api/commands", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        node_id: nodeId,
        command,
        payload: p
      })
    });

    const j = await r.json().catch(() => ({}));
    setLoading(false);

    if (!r.ok) {
      setMsg(j?.error ?? "Error");
      return;
    }
    setMsg(`OK: ${j.id} (${j.status})`);
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <label className="text-xs opacity-70">Project ID</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={projectId}
            onChange={(e) => setProjectId(normalizeProjectId(e.target.value))}
            placeholder="global"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs opacity-70">Node ID</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            placeholder="node-hocker-01"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs opacity-70">Command</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="PING"
          />
        </div>
      </div>

      <div>
        <label className="text-xs opacity-70">Payload (JSON)</label>
        <textarea
          className="w-full rounded border px-3 py-2 font-mono text-sm"
          rows={4}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={loading}
          className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar comando"}
        </button>
        {msg && <span className="text-sm opacity-80">{msg}</span>}
      </div>
    </div>
  );
}