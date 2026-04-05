"use client";

import { useState } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function CommandBox() {
  const { projectId, nodeId, refresh } = useWorkspace();

  const [command, setCommand] = useState("");
  const [payload, setPayload] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(): Promise<void> {
    if (!command.trim()) return;

    setLoading(true);
    setError(null);

    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(payload || "{}") as Record<string, unknown>;
    } catch {
      setError("El payload no es JSON válido.");
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
          command: command.trim(),
          payload: parsedPayload,
          needs_approval: false,
        }),
      });

      if (!res.ok) throw new Error("Error enviando comando");

      setCommand("");
      setPayload("{}");
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error enviando comando");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hocker-surface-soft space-y-4 p-5 hocker-fade-up">
      <div className="space-y-1">
        <p className="hocker-title-line">Emitir acción</p>
        <p className="hocker-kicker">Control directo del sistema</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-950/45 p-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          Comando
        </label>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Ej: supply.create_order"
          className="mt-1 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-950/45 p-3">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          Payload JSON
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
        {loading ? "Ejecutando..." : "Ejecutar"}
      </button>
    </div>
  );
}