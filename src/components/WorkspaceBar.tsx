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
    <div className={cn("shell-panel px-4 py-4", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
            Contexto de trabajo
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="shell-chip-brand">
              <Sparkles className="h-3.5 w-3.5" />
              {projectId}
            </span>

            <span className="shell-chip">Nodo: {nodeId}</span>

            <span className={tutorial ? "shell-chip-success" : "shell-chip-warning"}>
              {tutorial ? "Modo guiado" : "Modo experto"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleTutorial}
            className="shell-button-secondary"
          >
            {tutorial ? "Activar experto" : "Volver guiado"}
          </button>

          <button
            type="button"
            onClick={resetWorkspace}
            className="shell-button-secondary"
          >
            <RefreshCcw className="h-4 w-4" />
            Reiniciar contexto
          </button>
        </div>
      </div>
    </div>
  );
}