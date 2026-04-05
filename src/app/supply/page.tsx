import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";

const supply = [
  {
    title: "Carga real",
    desc: "Activos, pedidos y stock con lectura clara.",
  },
  {
    title: "Sincronía",
    desc: "Órdenes y estados alineados con el resto del ecosistema.",
  },
  {
    title: "Inventario",
    desc: "Visibilidad multi-proyecto y operación simple.",
  },
  {
    title: "HKR Supply",
    desc: "Identidad de línea con enfoque operativo y visual.",
  },
];

const roadmap = [
  "Carga de activos reales",
  "Sincronización de órdenes",
  "Inventario multi-proyecto",
  "Enlace HKR Supply",
];

export const metadata: Metadata = {
  title: "Supply",
  description: "Supervisión de la cadena de suministro.",
};

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
          Volver
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        <Hint title="Flujo de valor">
          Este sector unifica los datos comerciales. Desde la captura del lead hasta la entrega final.
        </Hint>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 hocker-page-enter">
          {supply.map((item) => (
            <div key={item.title} className="hocker-panel-pro p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-400">
                <span className="h-6 w-6 rounded-full border border-current" />
              </div>
              <h3 className="text-[14px] font-black uppercase tracking-wide text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                {item.desc}
              </p>
            </div>
          ))}
        </section>

        <section className="hocker-glass-vfx p-6 sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/5 pb-6 md:flex-row md:items-end">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">
                Roadmap logístico
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                Objetivos de integración
              </h2>
            </div>
            <div className="rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-sky-300">
              Fase 1 operativa
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {roadmap.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-sky-400">
                  0{index + 1}
                </p>
                <p className="mt-1 text-sm text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}