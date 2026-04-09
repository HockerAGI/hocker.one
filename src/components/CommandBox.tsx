"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function CommandBox() {
  const supabase = createBrowserSupabase();
  const { projectId, nodeId } = useWorkspace();

  const [command, setCommand] = useState("");
  const [payload, setPayload] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    let parsed: unknown;

    try {
      parsed = JSON.parse(payload || "{}");
    } catch {
      setError("Payload JSON inválido");
      return;
    }

    if (!command.trim()) {
      setError("El comando es obligatorio");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("commands").insert({
        project_id: projectId,
        node_id: nodeId,
        type: command.trim(),
        payload: parsed,
        status: "pending",
      });

      if (error) throw error;

      setCommand("");
      setPayload("{}");
      setOk(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar comando");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hocker-panel-pro p-5 flex flex-col gap-4"
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
          Inyección de comando
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Ejecuta acciones sobre el nodo activo con trazabilidad completa.
        </p>
      </div>

      <input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Ej: nodes.sync_status"
        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-sky-400"
      />

      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={5}
        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs font-mono text-emerald-300 outline-none focus:border-sky-400"
      />

      {error && (
        <div className="text-xs text-rose-400 font-medium">{error}</div>
      )}

      {ok && (
        <div className="text-xs text-emerald-400 font-medium">
          Comando enviado correctamente
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="hocker-button-brand w-full disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Ejecutar comando"}
      </button>
    </form>
  );
}