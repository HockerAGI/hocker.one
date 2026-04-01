"use client";
import { useState } from "react";
import { useWorkspace } from "./WorkspaceContext";
export default function CommandBox() {
  const [cmd, setCmd] = useState("");
  const [loading, setLoading] = useState(false);
  const { projectId } = useWorkspace();
  async function send() {
    if (!cmd.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, project_id: projectId }),
      });
      setCmd("");
    } finally { setLoading(false); }
  }
  return (
    <div className="hocker-panel-pro p-6 space-y-4">
      <h3 className="text-xs text-sky-400 font-black uppercase tracking-widest">Inyector Táctico</h3>
      <input value={cmd} onChange={(e) => setCmd(e.target.value)} className="w-full bg-black/40 p-4 rounded-xl text-sm border border-white/5 outline-none focus:border-sky-500/40" placeholder="Ej: deploy / scan / status" />
      <button onClick={send} disabled={loading} className="w-full bg-sky-500 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white hover:bg-sky-400 transition-all active:scale-95">
        {loading ? "PROCESANDO..." : "EJECUTAR ORDEN"}
      </button>
    </div>
  );
}
