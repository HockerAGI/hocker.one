import type { Metadata } from "next";
import Image from "next/image";
import PageShell from "@/components/PageShell";
import NovaChat from "@/components/NovaChat";
import AgisRegistry from "@/components/AgisRegistry";
import SystemStatus from "@/components/SystemStatus";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Soberanía Digital | Hocker ONE",
  description: "Terminal de orquestación central de la Mente Colmena Hocker.",
};

export default function HomePage() {
  return (
    <PageShell title="Matriz Central" subtitle="Protocolo Omni-Sync 2025 Activo">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:h-[calc(100vh-180px)]">
        
        {/* LADO IZQUIERDO: COMUNICACIÓN CON NOVA */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="hocker-panel-pro flex-1 flex flex-col overflow-hidden border-sky-500/20">
            <div className="p-4 border-b border-white/5 bg-sky-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">Nova Intelligence</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <NovaChat />
            </div>
          </div>
        </div>

        {/* CENTRO: TELEMETRÍA Y MARCA */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="hocker-glass-vfx p-8 flex flex-col items-center justify-center min-h-[280px] group">
            <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <Image 
              src="/brand/hocker-one-logo.png" 
              alt="Hocker One Logo" 
              width={400} 
              height={140} 
              className="drop-shadow-[0_0_30_px_rgba(14,165,233,0.4)] animate-float"
              priority
            />
            <div className="mt-8 grid grid-cols-3 gap-8 w-full border-t border-white/5 pt-8">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Status</div>
                <div className="text-sky-400 font-black">ONLINE</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Sync</div>
                <div className="text-white font-black">100%</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Threats</div>
                <div className="text-emerald-400 font-black">0.00</div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <CommandsQueue />
          </div>
        </div>

        {/* LADO DERECHO: AGENTES Y ESTADO */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <SystemStatus />
          <div className="flex-1 hocker-panel-pro overflow-hidden">
             <AgisRegistry title="Mente Colmena" />
          </div>
        </div>
      </div>

      {/* OVERLAY VFX: Partícula de inicio cinematográfico */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-slate-950 animate-out fade-out duration-1000 fill-mode-forwards">
         <Image src="/brand/hocker-one-isotype.png" alt="Isotype" width={80} height={80} className="animate-pulse" />
      </div>
    </PageShell>
  );
}
