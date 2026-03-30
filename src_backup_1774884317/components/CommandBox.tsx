import { getErrorMessage } from "@/lib/errors";
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { defaultNodeId, defaultProjectId, normalizeNodeId, normalizeProjectId } from "@/lib/project";
import type { CommandStatus } from "@/lib/types";

function pretty(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
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
      let parsed: unknown = {};
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
    } catch (e: unknown) {
      setMsg(e?getErrorMessage() ?? "Error");
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
          if (["done", "cancelled", "error", "failed"].includes(String(item.status))) {
            clearInterval(t);
          }
        }
      } catch {
        // sin-op
      }
    }, 2000);

    return () => clearInterval(t);
  }, [last?.id, pid]);

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur-2xl">
      <div className="mb-5 border-b border-white/5 pb-4">
        <h2 className="text-lg font-black tracking-tight text-white">Lanzador de AGIs</h2>
        <p className="mt-1 text-sm text-slate-400">Inyección manual de comandos al ecosistema.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Proyecto</label>
            <input
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Nodo</label>
            <input
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Comando</label>
            <input
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Ej: meta.send_msg / stripe.charge"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
              Payload (JSON)
            </label>
            <textarea
              className="mt-1.5 h-[220px] w-full resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 font-mono text-[13px] leading-relaxed text-sky-200 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
              Memoria de Salida
            </label>
            <div className="mt-1.5 h-[220px] overflow-auto rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 font-mono text-[13px] leading-relaxed text-emerald-200 shadow-inner">
              <pre>{last ? pretty(last) : "Esperando ejecución en la matriz..."}</pre>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "running" ? "animate-pulse bg-sky-400" : status === "done" ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
              <span className="text-[11px] font-semibold uppercase tracking-widest">
                Estado: {status ?? "inactivo"}
              </span>
            </div>

            {msg ? (
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-200">
                {msg}
              </span>
            ) : null}
          </div>

          <button
            onClick={send}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Inyectando..." : "Lanzar AGI"}
          </button>
        </div>
      </div>
    </div>
  );
}