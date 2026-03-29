import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import NovaChat from "@/components/NovaChat";
import AgisRegistry from "@/components/AgisRegistry";
import SystemStatus from "@/components/SystemStatus";
import CommandsQueue from "@/components/CommandsQueue";
import Hint from "@/components/Hint";

export const metadata: Metadata = {
  title: "Sala de Mando NOVA",
  description: "Interfaz de orquestación central de la Mente Colmena.",
};

export default function HomePage() {
  return (
    <PageShell
      title="Sala de Mando"
      subtitle="Supervisión activa de la Mente Colmena y ejecución de protocolos Omni-Sync."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M12 4l8 8-8 8" />
          </svg>
          Ir al Dashboard
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <Hint title="Protocolo de Conciencia Activo">
            Bienvenido, Director. El Automation Fabric está operando en niveles nominales. Las sub-IAs están listas para la sincronización de objetivos 2025.
          </Hint>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="xl:col-span-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="hocker-card p-1 shadow-blue-500/5">
              <NovaChat />
            </div>
          </div>

          <aside className="flex flex-col gap-8 xl:col-span-4 animate-in fade-in slide-in-from-right duration-700">
            <SystemStatus />
            <AgisRegistry title="Células Operativas" />
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 border-t border-white/5 pt-8 mt-4">
          <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 px-2">
                Cola de Ejecución en Tiempo Real
              </h3>
              <CommandsQueue />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}