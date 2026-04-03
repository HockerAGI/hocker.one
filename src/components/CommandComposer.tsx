"use client";

import { useWorkspace } from "@/components/WorkspaceContext";
import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";

export default function CommandComposer() {
  const { projectId } = useWorkspace();

  const [nodeId, setNodeId] = useState("hocker-fabric");
  const [command, setCommand] = useState("");
  const [payload, setPayload] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    setMsg(null);

    try {
      const parsed = JSON.parse(payload);

      const res = await fetch("/api/commands", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          node_id: nodeId,
          command,
          payload: parsed,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMsg("Comando enviado.");
      setCommand("");
    } catch (err: unknown) {
      setMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="hocker-panel-pro p-5">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-sky-400">
        Ejecutar comando
      </h3>

      <div className="mt-4 space-y-3">
        <input
          value={nodeId}
          onChange={(e) => setNodeId(e.target.value)}
          className="w-full rounded-xl bg-black/40 p-2 text-xs"
          placeholder="node_id"
        />

        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="w-full rounded-xl bg-black/40 p-2 text-xs"
          placeholder="command"
        />

        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="w-full rounded-xl bg-black/40 p-2 text-xs"
          rows={4}
        />

        <button
          onClick={send}
          disabled={loading}
          className="w-full rounded-xl bg-sky-500/20 p-2 text-xs font-bold"
        >
          {loading ? "Enviando..." : "Ejecutar"}
        </button>

        {msg && <p className="text-xs text-slate-400">{msg}</p>}
      </div>
    </section>
  );
}