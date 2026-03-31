"use client";

import React, { useMemo, useState } from "react";
import { defaultNodeId, defaultProjectId, normalizeNodeId, normalizeProjectId } from "@/lib/project";
import type { CommandStatus } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";

export default function CommandBox() {
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [nodeId, setNodeId] = useState(defaultNodeId());
  const [command, setCommand] = useState("status");
  const [payload, setPayload] = useState("{}");
  const [msg, setMsg] = useState<string | null>(null);

  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);
  const nid = useMemo(() => normalizeNodeId(nodeId), [nodeId]);

  const [status, setStatus] = useState<CommandStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setMsg(null);
    setLoading(true);

    try {
      let parsed: unknown = {};
      try {
        parsed = JSON.parse(payload || "{}");
      } catch {
        throw new Error("Payload no es un JSON válido. Verifica la sintaxis.");
      }

      const r = await fetch("/api/commands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: pid,
          node_id: nid,
          command,
          payload: parsed,
        }),
      });

      const data = await r.json();
      if (!r.ok) {
        throw new Error(data.error || "Falla en la transmisión del comando.");
      }

      setMsg("Comando inyectado con éxito en la Matriz.");
      setStatus("queued");
      setCommand("");
      setPayload("{}");
    } catch (err: unknown) {
      setMsg(getErrorMessage(err));
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hocker-panel-pro overflow-hidden">
      <div className="p-5 border-b border-white/5 bg-sky-500/5 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Terminal de Inyección</h3>
        <div className={`h-2 w-2 rounded-full ${status === 'running' ? 'bg-sky-400 animate-pulse' : status === 'error' ? 'bg-rose-500' : 'bg-slate-500'}`} />
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nodo Destino</label>
            <input
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs font-mono text-sky-300 focus:border-sky-500/50 outline-none transition-all shadow-inner"
              placeholder="hocker-fabric"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Instrucción</label>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs font-mono text-white focus:border-sky-500/50 outline-none transition-all shadow-inner"
              placeholder="status / deploy / restart"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Payload (JSON)</label>
          <div className="relative rounded-2xl border border-white/10 bg-slate-950/80 shadow-inner focus-within:border-sky-500/50 transition-all overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-white/5 border-r border-white/5 flex flex-col items-center pt-4 text-[10px] font-mono text-slate-600 select-none">
              1<br/>2<br/>3<br/>4
            </div>
            <textarea
              rows={4}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full bg-transparent pl-12 pr-4 py-4 text-xs font-mono text-emerald-300 outline-none custom-scrollbar resize-none"
              placeholder="{}"
              spellCheck="false"
            />
          </div>
        </div>

        {msg && (
          <div className={`rounded-2xl border px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-center ${status === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
            {msg}
          </div>
        )}

        <button
          onClick={send}
          disabled={loading || !command.trim()}
          className="w-full rounded-2xl bg-sky-500 py-4 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95 disabled:opacity-50"
        >
          {loading ? "INYECTANDO COMANDO..." : "EJECUTAR TRANSMISIÓN"}
        </button>
      </div>
    </div>
  );
}
