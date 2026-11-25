"use client";

import { useRef, useState } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function CommandBox() {
  const { projectId, nodeId, ready } = useWorkspace();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const lock = useRef(false);

  async function handleSend(): Promise<void> {
    const cleanTitle = title.trim();
    if (!cleanTitle || !ready || lock.current) return;
    lock.current = true;

    setLoading(true);
    setError(null);
    setDone(null);

    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          projectId,
          node_id: nodeId,
          nodeId,
          command: cleanTitle,
          payload: { description: details.trim() },
        }),
      });

      const body: unknown = await res.json().catch(() => ({}));
      const result = body && typeof body === "object" ? body as { ok?: boolean; item?: { id?: string; status?: string } } : {};
      if (!res.ok || result.ok !== true || !result.item?.id) {
        const msg = body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).error === "string" ? String((body as Record<string, unknown>).error) : "No se pudo crear la tarea.";
        throw new Error(msg);
      }

      setTitle("");
      setDetails("");
      setDone(result.item.status === "needs_approval" ? "Tarea creada. Pendiente de aprobación." : "Tarea registrada. Consulta su estado en la lista.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo crear la tarea.");
    } finally {
      lock.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="hko-module-card space-y-4">
      <div>
        <p className="hko-kicker">Nueva tarea</p>
        <h3 className="mt-2 text-xl font-black text-white">Crear tarea</h3>
        <p className="mt-2 text-sm text-slate-400">Registra una tarea para el nodo seleccionado. Los permisos se verifican en el servidor.</p>
      </div>
      <label className="block rounded-2xl border border-white/8 bg-slate-950/45 p-3">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Título</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: revisar apps pendientes" className="mt-2 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
      </label>
      <label className="block rounded-2xl border border-white/8 bg-slate-950/45 p-3">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Detalles opcionales</span>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} placeholder="Agrega contexto si hace falta." className="mt-2 w-full resize-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600" />
      </label>
      {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
      {done ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200" role="status">{done}</div> : null}
      <button onClick={() => void handleSend()} disabled={!ready || loading || !title.trim()} className="hko-action-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Creando..." : "Crear tarea"}
      </button>
    </div>
  );
}
