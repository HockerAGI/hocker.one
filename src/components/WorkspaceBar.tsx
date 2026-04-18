"use client";

import { Bot, Cpu, Sparkles, Waves } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import { cn } from "@/lib/cn";

export default function WorkspaceBar({ className }: { className?: string }) {
  const { projectId, nodeId } = useWorkspace();

  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-400"><Waves className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Señal</p>
            <p className="text-sm font-bold text-white uppercase">{projectId}</p>
          </div>
        </div>
      </div>
      
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400"><Cpu className="h-5 w-5" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nodo</p>
            <p className="text-sm font-bold text-white uppercase">{nodeId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}