"use client";

import { useState } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function CommandBox() {
  const { projectId, nodeId } = useWorkspace();
  const [command, setCommand] = useState("");
  const [payload, setPayload] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(): Promise<void> {
    const cleanCommand = command.trim();
    if (!cleanCommand) return;
    setLoading(true);
    setError(null);

    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(payload || "{}") as Record<string, unknown>;
    } catch {
      setError("Los detalles avanzados no tienen formato válido.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, projectId, node_id: nodeId, nodeId, command: cleanCommand, payload: parsedPayload, needs_approval: false }),
      });
      const body: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).error === "string" ? String((body as Record<string, unknown>).error) : "No se pudo enviar.";
        throw new Error(msg);
      }
      setCommand("");
      setPayload("{}");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tarea</label>
        <input value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Ej: revisar estado de apps" className="mt-1 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
      </div>

      <details className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3">
        <summary className="cursor-pointer text-[9px] font-black uppercase tracking-widest text-cyan-300">Detalles avanzados</summary>
        <textarea value={payload} onChange={(e) => setPayload(e.target.value)} rows={5} className="mt-3 w-full resize-none bg-transparent font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600" />
      </details>

      {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">{error}</div> : null}
      <button onClick={() => void handleSend()} disabled={loading} className="hocker-button-brand w-full">{loading ? "Enviando..." : "Enviar tarea"}</button>
    </div>
  );
}
