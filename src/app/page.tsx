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
      {/* Estructura de Cuadrícula Avanzada (Nivel Enterprise)
        Usa un 'Grid' dinámico que se adapta de 1 columna en celular a un diseño
        de operaciones complejo de 3 columnas en pantallas grandes.
      */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* ==========================================
            ÁREA DE MANDO PRINCIPAL (IZQUIERDA - 8/12)
            Prioridad absoluta a la interacción y control de IA.
            ========================================== */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* El Chat de NOVA como elemento "Hero" operativo */}
          <div className="flex-1 animate-in fade-in slide-in-from-left duration-300">
            <NovaChat />
          </div>

          {/* Guía inteligente justo debajo del canal de comunicación */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100 fill-mode-both">
            <Hint title="Inicio de Protocolo Omni-Sync">
              Soy NOVA. Desde esta interfaz, puedes darme órdenes analíticas o de control. 
              Si activas el Protocolo de Ejecución abajo, podré inyectar AGIs directamente 
              al Automation Fabric. Para ChidoCasino y Hocker Ads, te sugiero iniciar con 
              una orden de 'Auditoría de Mercado'.
            </Hint>
          </div>
        </div>

        {/* ==========================================
            PANEL DE MONITOREO LATERAL (DERECHA - 4/12)
            Visibilidad pasiva del estado de los activos y la salud del nodo.
            ========================================== */}
        <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-10rem)]">
          <div className="animate-in fade-in slide-in-from-right duration-300">
            <SystemStatus />
          </div>
          <div className="flex-1 animate-in fade-in slide-in-from-right duration-300 delay-100 fill-mode-both">
            <AgisRegistry title="Células de Inteligencia" />
          </div>
        </aside>

        {/* ==========================================
            ÁREA DE MEMORIA Y FLUJO (INFERIOR - Full width)
            Registro histórico y cola operativa que se actualiza en tiempo real.
            ========================================== */}
        <footer className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-12 border-t border-slate-100 pt-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          {/* Orquestador de Comandos (Cola Operativa en Vivo) */}
          <div className="h-full">
            <CommandsQueue />
          </div>
          
          {/* Registro de Memoria (Radar Biométrico en Vivo) */}
          <div className="h-full">
            <EventsFeed />
          </div>
        </footer>
      </div>
    </PageShell>
  );
}
