import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";

export const metadata: Metadata = {
  title: "Supply",
  description: "Supervisión de la cadena de suministro, inventarios y cumplimiento operativo.",
};

const supply = [
  {
    title: "Catálogo Maestro",
    desc: "Productos y servicios estandarizados listos para despliegue comercial.",
  },
  {
    title: "Órdenes Activas",
    desc: "Seguimiento en tiempo real del estado, flujo y cumplimiento de pedidos.",
  },
  {
    title: "Inventario Global",
    desc: "Visibilidad total de activos disponibles y alertas de reabastecimiento.",
  },
  {
    title: "Trazabilidad Logística",
    desc: "Control del movimiento interno y optimización de rutas de entrega.",
  },
];

const roadmap = [
  "Carga de activos reales",
  "Sincronización de órdenes",
  "Inventario multi-proyecto",
  "Enlace logístico HKR SUPPLY",
];

export default function SupplyPage() {
  return (
    <PageShell
      title="Logística Operativa"
      subtitle="Supervisión de la cadena de suministro, inventarios y cumplimiento operativo."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Panel
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        <Hint title="Operación de Suministros">
          Aquí se concentra la fuerza comercial de HKR SUPPLY. Cada orden conserva trazabilidad completa dentro de la Mente Colmena.
        </Hint>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {supply.map((item) => (
            <div key={item.title} className="hocker-card p-6 transition hover:-translate-y-0.5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div className="text-lg font-black tracking-tight text-white">{item.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">{item.desc}</div>
            </div>
          ))}
        </section>

        <section className="hocker-glass rounded-[32px] p-6 md:p-8">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-sky-300">
              Roadmap Logístico
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              Objetivos de Integración
            </h2>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {roadmap.map((text) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-100"
              >
                <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                {text}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}