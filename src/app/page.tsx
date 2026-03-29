import PageShell from "@/components/PageShell";
import NovaChat from "@/components/NovaChat";
import AgisRegistry from "@/components/AgisRegistry";
import SystemStatus from "@/components/SystemStatus";
import CommandsQueue from "@/components/CommandsQueue";
import Hint from "@/components/Hint";
import EventsFeed from "@/components/EventsFeed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sala de Mando NOVA",
  description: "Acceso centralizado al Automation Fabric y la Mente Colmena.",
};

export default function HomePage() {
  return (
    <PageShell
      title="Sala de Mando Central"
      subtitle="Supervisa las inteligencias, audita la memoria y ejecuta comandos directos al ecosistema."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        
        {/* ==========================================
            ÁREA DE MANDO PRINCIPAL (IZQUIERDA - 7/12)
            ========================================== */}
        <div className="flex flex-col gap-6 xl:col-span-7">
          <div className="animate-in fade-in slide-in-from-left duration-300">
            <NovaChat />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100 fill-mode-both">
            <Hint title="Inicio de Protocolo Omni-Sync">
              Soy NOVA. Desde esta interfaz, puedes darme órdenes analíticas o de control. 
              Si activas el Protocolo de Ejecución, podré inyectar comandos al Automation Fabric.
            </Hint>
          </div>
        </div>

        {/* ==========================================
            PANEL DE MONITOREO LATERAL (DERECHA - 5/12)
            ========================================== */}
        <aside className="flex flex-col gap-6 xl:col-span-5">
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <SystemStatus />
          </div>
          <div className="animate-in fade-in slide-in-from-right duration-300 delay-100 fill-mode-both">
            <AgisRegistry title="Células de Inteligencia" />
          </div>
        </aside>

        {/* ==========================================
            ÁREA DE MEMORIA Y FLUJO (INFERIOR)
            ========================================== */}
        <footer className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:col-span-12 border-t border-slate-100/60 pt-6 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          <div className="h-full">
            <CommandsQueue />
          </div>
          <div className="h-full">
            <EventsFeed />
          </div>
        </footer>
      </div>
    </PageShell>
  );
}
