"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import Hint from "@/components/Hint";
import type { CommandStatus } from "@/lib/types";

function pretty(o: any) {
  try {
    return JSON.stringify(o, null, 2);
  } catch {
    return String(o);
  }
}

export default function CommandBox() {
  const { projectId: pid, nodeId: nid } = useWorkspace();

  const [command, setCommand] = useState("status");
  const [payload, setPayload] = useState("{}");
  const [msg, setMsg] = useState<string | null>(null);

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
          if (["done", "canceled", "error", "failed", "cancelled"].includes(String(item.status))) {
            clearInterval(t);
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(t);
  }, [last?.id, pid]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <Hint title="Cómo usar esto">
        Selecciona <b>Proyecto</b> y <b>Nodo</b> arriba en la barra global. Aquí solo disparas la acción.
      </Hint>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="w-full">
          <label className="text-xs font-semibold text-slate-600">Command</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Ej: status / ping / shell.exec"
          />
          <div className="mt-1 text-xs text-slate-500">
            Proyecto: <b>{pid}</b> · Nodo: <b>{nid}</b>
          </div>
        </div>

        <button
          onClick={send}
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Ejecutando..." : "Lanzar"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-slate-600">Payload (JSON)</label>
          <textarea
            className="mt-1 h-[140px] w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">Resultado</label>
          <div className="mt-1 h-[140px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800">
            {last ? pretty(last) : "Esperando ejecución..."}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">
          Estado: <b>{status ?? "—"}</b>
        </span>
        {msg && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{msg}</span>}
      </div>
    </div>
  );
}