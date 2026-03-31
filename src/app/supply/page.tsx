import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";

export const metadata: Metadata = {
  title: "Supply",
  description: "Supervisión de la cadena de suministro, inventarios y cumplimiento.",
};

const supply = [
  { title: "Catálogo Maestro", desc: "Productos y servicios listos para despliegue." },
  { title: "Órdenes Activas", desc: "Flujo y cumplimiento de pedidos en tiempo real." },
  { title: "Inventario Global", desc: "Visibilidad total de activos y alertas de stock." },
  { title: "Rutas Logísticas", desc: "Control de distribución y optimización de entrega." },
];

const roadmap = [
  "Carga de activos reales",
  "Sincronización de órdenes",
  "Inventario multi-proyecto",
  "Enlace HKR SUPPLY",
];

export default function SupplyPage() {
  return (
    <PageShell
      title="Logística Operativa"
      subtitle="Supervisión de la cadena de suministro, inventarios y cumplimiento."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-100 transition hover:bg-white/10 active:scale-95"
        >
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        <Hint title="Flujo de Valor">
          Este sector unifica los datos comerciales. Desde la captura del lead por las IAs hasta la entrega final del producto.
        </Hint>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {supply.map((item, i) => (
            <div key={i} className="hocker-panel-pro p-6 flex flex-col items-center text-center group">
              <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform duration-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h3 className="text-[14px] font-black uppercase tracking-wide text-white">{item.title}</h3>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="hocker-glass-vfx p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-6 mb-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Roadmap Logístico</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Objetivos de Integración</h2>
            </div>
            <div className="mt-4 md:mt-0 px-4 py-2 rounded-full border border-sky-500/30 bg-sky-500/10 text-[10px] font-black uppercase tracking-widest text-sky-300">
              Fase 1 Operativa
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 relative">
            {/* Conector visual entre pasos */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-sky-500/50 via-sky-500/20 to-transparent -translate-y-1/2 z-0" />
            
            {roadmap.map((text, i) => (
              <div key={text} className="relative z-10 flex flex-col items-center text-center p-4">
                <div className="h-8 w-8 rounded-full border-2 border-slate-900 bg-sky-500 text-white flex items-center justify-center text-[10px] font-black shadow-[0_0_15px_rgba(14,165,233,0.5)] mb-3">
                  0{i + 1}
                </div>
                <span className="text-[12px] font-bold uppercase tracking-wide text-slate-200">{text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
