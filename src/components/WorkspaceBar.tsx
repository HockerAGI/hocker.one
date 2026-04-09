"use client";

import { useWorkspace } from "@/components/WorkspaceContext";

export default function WorkspaceBar() {
  const { projectId, nodeId, tutorial, setNodeId, toggleTutorial } = useWorkspace();

  return (
    <section className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4 shadow-[0_12px_50px_rgba(2,6,23,0.18)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-sky-400">
            Workspace
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Contexto de operación activo
          </p>
        </div>

        <button
          type="button"
          onClick={toggleTutorial}
          aria-pressed={tutorial}
          className={[
            "rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all",
            tutorial
              ? "border-sky-400/20 bg-sky-500/10 text-sky-300"
              : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.06] hover:text-white",
          ].join(" ")}
        >
          {tutorial ? "Guía ON" : "Guía OFF"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-white/5 bg-slate-950/45 p-3">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Proyecto
          </label>
          <div className="mt-1 truncate font-mono text-xs text-slate-100">
            {projectId}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-950/45 p-3">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Nodo
          </label>
          <input
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            className="mt-1 w-full bg-transparent font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600"
            placeholder="hocker-agi"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-slate-300">
            {tutorial ? "Modo guiado" : "Modo libre"}
          </span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-emerald-300">
            Live
          </span>
        </div>
      </div>
    </section>
  );
}