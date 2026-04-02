"use client";

import { useWorkspace } from "@/components/WorkspaceContext";

export default function WorkspaceBar() {
  const { projectId, nodeId, tutorial, setNodeId, toggleTutorial } = useWorkspace();

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-3">
        {/* PROYECTO (READ ONLY) */}
        <div className="group relative flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/60 p-2 pl-4 shadow-inner">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Sector
          </span>
          <input
            value={projectId}
            readOnly
            className="w-full bg-transparent text-xs font-mono font-bold text-sky-100 outline-none cursor-not-allowed"
          />
        </div>

        {/* NODO (EDITABLE REAL) */}
        <div className="group relative flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/60 p-2 pl-4 shadow-inner transition-colors focus-within:border-emerald-500/40 focus-within:bg-slate-900/80">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-focus-within:text-emerald-400">
            Enlace
          </span>
          <input
            value={nodeId ?? ""}
            onChange={(e) => setNodeId(e.target.value)}
            className="w-full bg-transparent text-xs font-mono font-bold text-emerald-100 outline-none placeholder:text-slate-600"
            placeholder="hocker-fabric"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        {/* TOGGLE */}
        <label className="group flex cursor-pointer items-center gap-3">
          <button
            type="button"
            onClick={toggleTutorial}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-all ${
              tutorial
                ? "bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                : "bg-slate-800"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                tutorial ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>

          <span
            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
              tutorial ? "text-sky-400" : "text-slate-500"
            }`}
          >
            Guías
          </span>
        </label>
      </div>
    </div>
  );
}