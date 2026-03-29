import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import Link from "next/link";

const supply = [
  {
    title: "Catálogo Maestro",
    desc: "Productos y servicios estandarizados listos para su despliegue comercial.",
    icon: (
      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    title: "Órdenes Activas",
    desc: "Seguimiento en tiempo real del estado, flujo y cumplimiento de pedidos.",
    icon: (
      <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    title: "Inventario Global",
    desc: "Visibilidad total de activos disponibles y alertas de reabastecimiento crítico.",
    icon: (
      <svg className="h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    title: "Trazabilidad Logística",
    desc: "Control del movimiento interno y optimización de las rutas de entrega.",
    icon: (
      <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
];

const roadmap = [
  "Carga de Activos Reales",
  "Sincronización de Órdenes",
  "Inventario Multi-Proyecto",
  "Enlace Logístico HKR SUPPLY",
];

export default function SupplyPage() {
  return (
    <PageShell
      title="Logística Operativa"
      subtitle="Supervisión de la cadena de suministro, inventarios y cumplimiento operativo."
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
      <div className="flex flex-col gap-8">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Hint title="Operación de Suministros">
            Aquí se concentra la fuerza comercial de HKR SUPPLY. Cada orden generada en este sector tiene trazabilidad absoluta dentro de la Mente Colmena, permitiendo un control total sobre las entregas y existencias.
          </Hint>
        </div>
        
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          {supply.map((item) => (
            <div key={item.title} className="hocker-card p-6 transition-all hover:scale-[1.03] group">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-blue-50">
                {item.icon}
              </div>
              <div className="text-lg font-black tracking-tight text-slate-950">{item.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</div>
            </div>
          ))}
        </section>

        <section className="hocker-glass rounded-[32px] p-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Roadmap Logístico</div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-950">Objetivos de Integración</h2>
          </div>
          
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {roadmap.map((text) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 px-5 py-4 text-sm font-bold text-blue-900 shadow-sm transition-all hover:bg-blue-50/60"
              >
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                Sincronización: {text}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
