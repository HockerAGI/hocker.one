import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NodesPanel from "@/components/NodesPanel";
import Link from "next/link";

export default function NodesPage() {
  return (
    <PageShell
      title="Infraestructura de Nodos"
      subtitle="Supervisión técnica de los activos de ejecución y puntos de control distribuidos."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98]"
        >
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Volver al Panel
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Telemetría de red con entrada cinemática */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Hint title="Soberanía de Red">
            Cada nodo representa una unidad de ejecución del Automation Fabric. Desde aquí puedes auditar el latido de tus servidores y agentes físicos para asegurar que la Mente Colmena tenga donde procesar sus órdenes.
          </Hint>
        </div>
        
        {/* Panel de Control de Nodos */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <NodesPanel />
        </div>
      </div>
    </PageShell>
  );
}
