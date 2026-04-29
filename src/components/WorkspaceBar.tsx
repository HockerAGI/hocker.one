"use client";

import { RefreshCcw, Sparkles } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import { cn } from "@/lib/cn";

type WorkspaceBarProps = {
  className?: string;
};

export default function WorkspaceBar({ className }: WorkspaceBarProps) {
  const { projectId, nodeId, tutorial, toggleTutorial, resetWorkspace } = useWorkspace();

  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-slate-950/52 px-4 py-3 shadow-[0_14px_50px_rgba(0,0,0,0.18)] backdrop-blur-2xl",
        className,
      )}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-sky-100">
            <Sparkles className="h-3.5 w-3.5" />
            {projectId}
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
            Nodo: {nodeId}
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100">
            {tutorial ? "Guía activa" : "Modo libre"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={toggleTutorial}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-[10px] font-black uppercase tracking-[0.20em] text-slate-200 transition hover:bg-white/[0.06]"
          >
            {tutorial ? "Desactivar guía" : "Activar guía"}
          </button>

          <button
            type="button"
            onClick={resetWorkspace}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-[10px] font-black uppercase tracking-[0.20em] text-slate-200 transition hover:bg-white/[0.06]"
          >
            <RefreshCcw className="h-4 w-4" />
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}
