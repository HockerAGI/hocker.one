"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Sparkles } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function Topbar() {
  const pathname = usePathname() || "/";
  const { projectId, nodeId } = useWorkspace();

  const getTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Centro de Control";
    if (pathname.startsWith("/chat")) return "Nova AGI";
    if (pathname.startsWith("/commands")) return "Tareas Operativas";
    if (pathname.startsWith("/nodes")) return "Gestión de Nodos";
    if (pathname.startsWith("/agis")) return "Unidades AGI";
    if (pathname.startsWith("/supply")) return "Suministros";
    return "Hocker ONE";
  };

  return (
    <header className="fixed top-0 right-0 z-40 flex h-[94px] w-full items-center justify-between border-b border-white/5 bg-[#020617]/80 px-6 backdrop-blur-3xl lg:w-[calc(100%-292px)]">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-black tracking-tighter text-white uppercase">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 sm:block">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Workspace</p>
          <p className="text-xs font-bold text-white">{projectId}</p>
        </div>

        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-slate-400 hover:text-white transition-all">
          <Bell className="h-5 w-5" />
        </button>

        <Link href="/chat" className="flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-950 shadow-lg shadow-sky-500/20 hover:-translate-y-0.5 transition-all">
          NOVA <Sparkles className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}