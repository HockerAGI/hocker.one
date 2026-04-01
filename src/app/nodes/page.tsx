import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NodesPanel from "@/components/NodesPanel";

export const metadata: Metadata = {
  title: "Infraestructura de Nodos",
  description: "Supervisión técnica de los activos de ejecución.",
};

export default function NodesPage() {
  return (
    <PageShell
      title="Red de Nodos"
      subtitle="Supervisión técnica de los activos de ejecución y puntos de control distribuidos."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-sky-400 transition-all hover:bg-sky-500/20 active:scale-95"
        >
          Volver
        </Link>
      }
    >
      <div className="flex flex-col gap-8">

        {/* HINT */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <Hint title="Soberanía de Red">
            Cada nodo representa una unidad de ejecución del Automation Fabric. Audita el latido de servidores y agentes físicos desde este radar.
          </Hint>
        </div>

        {/* PANEL */}
        <div className="hocker-panel-pro relative overflow-hidden border-sky-500/10 animate-in fade-in slide-in-from-bottom-6 duration-700 min-h-[400px]">

          {/* VFX */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, #0ea5e9 2px, transparent 2px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 p-6 sm:p-8">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
                Radar de Activos
              </h2>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Escaneo Activo
                </span>
              </div>
            </div>

            <NodesPanel />
          </div>
        </div>
      </div>
    </PageShell>
  );
}