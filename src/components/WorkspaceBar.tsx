"use client";

import { useWorkspace } from "@/components/WorkspaceContext";

export default function WorkspaceBar() {
  const { projectId, nodeId, tutorial, setProjectId, setNodeId, setTutorial, reset } =
    useWorkspace();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-2 border-t border-slate-100/50 mt-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-1.5 shadow-inner transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Proyecto</span>
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-32 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-300"
            placeholder="global"
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-1.5 shadow-inner transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Nodo</span>
          <input
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            className="w-40 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-300"
            placeholder="node-hocker-01"
          />
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          title="Restaurar parámetros por defecto"
        >
          Reset
        </button>
      </div>

      <label className="group flex cursor-pointer items-center gap-2 self-end md:self-auto mt-2 md:mt-0">
        <span className={`text-[10px] font-extrabold uppercase tracking-widest transition-colors ${tutorial ? "text-blue-600" : "text-slate-400"}`}>
          Guías de Entorno
        </span>
        <button
          type="button"
          onClick={() => setTutorial(!tutorial)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            tutorial ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]" : "bg-slate-300"
          }`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${tutorial ? "translate-x-4.5" : "translate-x-1"}`} />
        </button>
      </label>
    </div>
  );
}
