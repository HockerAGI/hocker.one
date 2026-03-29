"use client";

import React, { useEffect, useMemo, useState } from "react";
import { defaultNodeId, defaultProjectId, normalizeNodeId, normalizeProjectId } from "@/lib/project";
import type { CommandStatus } from "@/lib/types";

function pretty(o: any) {
  try {
    return JSON.stringify(o, null, 2);
  } catch {
    return String(o);
  }
}

export default function CommandBox() {
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [nodeId, setNodeId] = useState(defaultNodeId());
  const [command, setCommand] = useState("status");
  const [payload, setPayload] = useState("{}");
  const [msg, setMsg] = useState<string | null>(null);

  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);
  const nid = useMemo(() => normalizeNodeId(nodeId), [nodeId]);

  const [last, setLast] = useState<any>(null);
  const [status, setStatus] = useState<CommandStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setMsg(null);
    setLoading(true);
    try {
      let parsed: any = {};
      try {
        parsed = JSON.parse(payload || "{}");
      } catch {
        throw new Error("Payload no es JSON válido.");
      }

      const r = await fetch("/api/commands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: pid,
          node_id: nid,
          command: command.trim(),
          payload: parsed,
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error ?? "Error creando comando.");

      setLast(j.item);
      setStatus(j.item?.status ?? null);
    } catch (e: any) {
      setMsg(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!last?.id) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/commands?project_id=${encodeURIComponent(pid)}&id=${encodeURIComponent(last.id)}`);
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.ok) return;
        const item = (j.items ?? [])[0];
        if (item?.id) {
          setLast(item);
          setStatus(item.status);
          if (["done", "canceled", "error"].includes(item.status)) {
            clearInterval(t);
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(t);
  }, [last?.id, pid]);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900">Lanzador de AGIs</h2>
        <p className="text-sm text-slate-500">Inyección manual de comandos al ecosistema.</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:w-[280px]">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Project</label>
          <input className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        </div>
        <div className="w-full md:w-[280px]">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Node</label>
          <input className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" value={nodeId} onChange={(e) => setNodeId(e.target.value)} />
        </div>
        <div className="w-full md:flex-1">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Command</label>
          <input className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Ej: meta.send_msg / stripe.charge" />
        </div>
        <button onClick={send} disabled={loading} className="mt-2 w-full md:mt-0 md:w-auto rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          {loading ? "Inyectando..." : "Lanzar AGI"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Payload (Entrada JSON)</label>
          <textarea 
            className="mt-1.5 h-[180px] w-full resize-none rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[13px] leading-relaxed text-blue-300 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" 
            value={payload} 
            onChange={(e) => setPayload(e.target.value)} 
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Memoria de Resultado (Salida)</label>
          <div className="mt-1.5 h-[180px] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[13px] leading-relaxed text-emerald-300 shadow-inner">
            <pre>{last ? pretty(last) : "Esperando ejecución en la matriz..."}</pre>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 text-sm">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
          <div className={`h-2 w-2 rounded-full ${status === 'running' ? 'bg-blue-500 animate-pulse' : status === 'done' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
          <span>Estado Orquestador: <b className="font-semibold uppercase tracking-wider text-[11px] ml-1">{status ?? "inactivo"}</b></span>
        </div>
        {msg && <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800 font-medium">{msg}</span>}
      </div>
    </div>
  );
}
