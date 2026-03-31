"use client";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function WorkspaceBar() {
  const { projectId, nodeId, tutorial, setProjectId, setNodeId, setTutorial, reset } = useWorkspace();

  return (
    <div className="flex flex-col gap-6 py-4 border-t border-white/5">
      <div className="space-y-4">
        <div className="px-1 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Proyecto</label>
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs font-bold text-sky-400 focus:border-sky-500/40 outline-none transition-all shadow-inner"
            placeholder="global"
          />
        </div>

        <div className="px-1 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nodo Activo</label>
          <input
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs font-bold text-white focus:border-sky-500/40 outline-none transition-all shadow-inner"
            placeholder="hocker-fabric"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTutorial(!tutorial)}
            className={`relative h-5 w-10 rounded-full transition-colors ${tutorial ? "bg-sky-500" : "bg-slate-800"}`}
          >
            <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${tutorial ? "translate-x-5" : "translate-x-0"}`} />
          </button>
          <span className={`text-[10px] font-black uppercase tracking-widest ${tutorial ? "text-sky-400" : "text-slate-600"}`}>
            Guías
          </span>
        </div>
        
        <button onClick={reset} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
          Reiniciar
        </button>
      </div>
    </div>
  );
}
