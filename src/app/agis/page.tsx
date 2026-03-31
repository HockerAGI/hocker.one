export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import AgisRegistry from "@/components/AgisRegistry";

export const metadata: Metadata = {
  title: "Células de Inteligencia",
  description: "Jerarquía y delegación de funciones tácticas de la Mente Colmena.",
};

export default function AgisPage() {
  return (
    <PageShell 
      title="Células de Inteligencia" 
      subtitle="Jerarquía operativa y asignación de agentes de la Mente Colmena."
      actions={
        <Link
          href="/chat"
          className="hocker-button-primary"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Terminal NOVA
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        <Hint title="Arquitectura de Mando">
          Cada agente opera en un perímetro estricto. La orquestación central de NOVA garantiza que no existan colisiones en la ejecución de la directiva Omni-Sync.
        </Hint>

        <div className="grid grid-cols-1 gap-6">
          {/* El registro de AGIs ahora se presenta en un contenedor de alta densidad */}
          <div className="hocker-panel-pro p-1 shadow-sky-500/5">
            <AgisRegistry title="Estado de Agentes" className="border-none" />
          </div>
        </div>

        {/* Sección de Telemetría de Agentes (VFX) */}
        <section className="hocker-glass-vfx p-8 bg-gradient-to-br from-indigo-500/5 to-transparent">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Capacidad de Procesamiento</h3>
            <span className="text-emerald-400 font-mono text-xs">Sincronización: 100%</span>
          </div>
          <div className="space-y-6">
            {[
              { label: "Análisis Predictivo", val: "85%" },
              { label: "Generación de Activos", val: "92%" },
              { label: "Monitoreo de Red", val: "98%" }
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold uppercase text-slate-400">
                  <span>{item.label}</span>
                  <span>{item.val}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 shadow-[0_0_8px_#0ea5ff]" style={{ width: item.val }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
