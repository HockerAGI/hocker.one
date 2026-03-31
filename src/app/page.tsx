import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PageShell from "@/components/PageShell";
import NovaChat from "@/components/NovaChat";
import AgisRegistry from "@/components/AgisRegistry";
import SystemStatus from "@/components/SystemStatus";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Sala de Mando NOVA",
  description: "Interfaz de orquestación central de la Mente Colmena.",
};

export default function HomePage() {
  return (
    <PageShell
      title="Sala de Mando"
      subtitle="Supervisión activa del ecosistema y ejecución de protocolos Omni-Sync."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)] transition-all hover:bg-sky-500/20 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M12 4l8 8-8 8" />
          </svg>
          Dashboard
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:h-[calc(100vh-180px)]">
        
        {/* COLUMNA IZQUIERDA: NOVA CHAT */}
        <div className="flex flex-col gap-6 lg:col-span-4 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="hocker-panel-pro flex flex-1 flex-col overflow-hidden border-sky-500/20">
            <div className="flex-1 p-2">
              <NovaChat />
            </div>
          </div>
        </div>

        {/* COLUMNA CENTRAL: IDENTIDAD Y OPERACIONES */}
        <div className="flex flex-col gap-6 lg:col-span-5 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {/* HUD de Identidad */}
          <div className="hocker-glass-vfx group flex min-h-[220px] flex-col items-center justify-center p-8">
            <div className="absolute inset-0 bg-sky-500/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <Image 
              src="/brand/hocker-one-logo.png" 
              alt="Hocker One" 
              width={320} 
              height={112} 
              className="animate-float drop-shadow-[0_0_30px_rgba(14,165,233,0.4)]"
              priority
            />
            <div className="mt-8 grid w-full grid-cols-3 gap-8 border-t border-white/5 pt-6 relative z-10">
              <div className="text-center">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Núcleo</div>
                <div className="text-sky-400 font-black text-sm drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]">ONLINE</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sync</div>
                <div className="text-white font-black text-sm">100%</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Amenazas</div>
                <div className="text-emerald-400 font-black text-sm">CERO</div>
              </div>
            </div>
          </div>

          {/* Cola de Comandos */}
          <div className="flex-1 min-h-[400px]">
            <CommandsQueue />
          </div>
        </div>

        {/* COLUMNA DERECHA: TELEMETRÍA Y CÉLULAS */}
        <aside className="flex flex-col gap-6 lg:col-span-3 animate-in fade-in slide-in-from-right-4 duration-700">
          <SystemStatus />
          <div className="hocker-panel-pro min-h-[300px] flex-1 overflow-hidden">
             <AgisRegistry title="Células Operativas" />
          </div>
        </aside>

      </div>
    </PageShell>
  );
}
