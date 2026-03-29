"use client";

import { useWorkspace } from "@/components/WorkspaceContext";

export default function WorkspaceBar() {
  const { projectId, nodeId, tutorial, setProjectId, setNodeId, setTutorial, reset } = useWorkspace();

  return (
    <div className="flex flex-col gap-3 border-t border-white/5 py-2 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 shadow-inner transition-colors focus-within:border-sky-400 focus-within:bg-white/10">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Proyecto</span>
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-32 bg-transparent text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-500"
            placeholder="global"
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 shadow-inner transition-colors focus-within:border-sky-400 focus-within:bg-white/10">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Nodo</span>
          <input
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            className="w-40 bg-transparent text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-500"
            placeholder="hocker-fabric"
          />
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
          title="Restaurar parámetros por defecto"
        >
          Reset
        </button>
      </div>

      <label className="group mt-2 flex cursor-pointer items-center gap-2 self-end md:mt-0 md:self-auto">
        <span className={`text-[10px] font-extrabold uppercase tracking-widest transition-colors ${tutorial ? "text-sky-300" : "text-slate-400"}`}>
          Guías de Entorno
        </span>
        <button
          type="button"
          onClick={() => setTutorial(!tutorial)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
            tutorial ? "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.3)]" : "bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              tutorial ? "translate-x-4.5" : "translate-x-1"
            }`}
          />
        </button>
      </label>
    </div>
  );
}