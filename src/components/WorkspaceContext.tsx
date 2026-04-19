"use client";

import { RefreshCcw, Sparkles } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

type WorkspaceBarProps = {
  className?: string;
};

export default function WorkspaceBar({ className = "" }: WorkspaceBarProps) {
  const { projectId, nodeId, tutorial, toggleTutorial, resetWorkspace } = useWorkspace();

  return (
    <div
      className={[
        "rounded-[28px] border border-white/5 bg-white/[0.03] px-4 py-3 shadow-[0_14px_50px_rgba(2,6,23,0.18)] backdrop-blur-2xl",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/15 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-sky-200">
            <Sparkles className="h-3.5 w-3.5" />
            {projectId}
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
            Nodo: {nodeId}
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
            {tutorial ? "Guía activa" : "Modo libre"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleTutorial}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.34em] text-slate-200 transition-all hover:bg-white/[0.06]"
          >
            {tutorial ? "Desactivar guía" : "Activar guía"}
          </button>

          <button
            type="button"
            onClick={resetWorkspace}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.34em] text-slate-200 transition-all hover:bg-white/[0.06]"
          >
            <RefreshCcw className="h-4 w-4" />
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}