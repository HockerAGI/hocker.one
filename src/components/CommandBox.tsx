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
      setError("Los detalles no tienen un formato válido.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          projectId,
          node_id: nodeId,
          nodeId,
          command: cleanCommand,
          payload: parsedPayload,
          needs_approval: false,
        }),
      });

      const body: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).error === "string"
            ? String((body as Record<string, unknown>).error)
            : "No se pudo enviar.";
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
    <div className="hocker-surface-soft space-y-4 p-5 hocker-fade-up">
      <div className="space-y-1">
        <p className="hocker-title-line">Nueva tarea</p>
        <p className="hocker-kicker">Escribe una instrucción breve y clara.</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-950/45 p-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          Tarea
        </label>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Ej: revisar inventario"
          className="mt-1 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-950/45 p-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          Detalles
        </label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={6}
          className="mt-1 w-full resize-none bg-transparent text-xs font-mono text-slate-100 outline-none placeholder:text-slate-600"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {error}
        </div>
      ) : null}

      <button
        onClick={() => void handleSend()}
        disabled={loading}
        className="hocker-button-brand w-full"
      >
        {loading ? "Enviando..." : "Enviar tarea"}
      </button>
    </div>
  );
}