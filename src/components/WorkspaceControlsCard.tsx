"use client";

import { BookOpenCheck, RotateCcw } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function WorkspaceControlsCard() {
  const {
    ready,
    projectId,
    nodeId,
    tutorial,
    toggleTutorial,
    resetWorkspace,
  } = useWorkspace();

  return (
    <section className="hocker-panel-pro p-5" aria-labelledby="workspace-controls-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Workspace</p>
          <h2 id="workspace-controls-title" className="mt-2 text-xl font-black text-white">
            Preferencias operativas
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Conserva los controles del workspace sin ocupar espacio permanente en la navegación.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-bold text-slate-300">
          {tutorial ? "Guía activa" : "Modo libre"}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Proyecto</dt>
          <dd className="mt-1 break-all text-sm font-bold text-slate-200">{ready ? projectId : "Cargando…"}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Nodo</dt>
          <dd className="mt-1 break-all text-sm font-bold text-slate-200">{ready ? nodeId : "Cargando…"}</dd>
        </div>
      </dl>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={toggleTutorial}
          disabled={!ready}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-3 text-sm font-black text-cyan-100 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          {tutorial ? "Desactivar guía" : "Activar guía"}
        </button>
        <button
          type="button"
          onClick={resetWorkspace}
          disabled={!ready}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-black text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          Restablecer workspace
        </button>
      </div>
    </section>
  );
}
