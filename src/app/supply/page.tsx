import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";

export const metadata: Metadata = {
  title: "Supply",
  description: "Supervisión de la cadena de suministro, inventarios y cumplimiento.",
};

const supply = [
  {
    title: "Carga real",
    desc: "Activos, pedidos y stock con lectura clara.",
    accent: "sky",
  },
  {
    title: "Sincronía",
    desc: "Órdenes y estados alineados con el resto del ecosistema.",
    accent: "emerald",
  },
  {
    title: "Inventario",
    desc: "Visibilidad multi-proyecto y operación simple.",
    accent: "cyan",
  },
  {
    title: "HKR Supply",
    desc: "Identidad de línea con enfoque operativo y visual.",
    accent: "rose",
  },
] as const;

const roadmap = [
  "Carga de activos reales",
  "Sincronización de órdenes",
  "Inventario multi-proyecto",
  "Enlace HKR Supply",
] as const;

const metrics = [
  { label: "Pedidos", value: "En vivo" },
  { label: "Stock", value: "Activo" },
  { label: "Entregas", value: "Rastreables" },
  { label: "Estado", value: "Listo" },
] as const;

function accentClass(accent: (typeof supply)[number]["accent"]): string {
  switch (accent) {
    case "emerald":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.12)]";
    case "cyan":
      return "border-cyan-400/20 bg-cyan-500/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]";
    case "rose":
      return "border-rose-400/20 bg-rose-500/10 text-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.12)]";
    default:
      return "border-sky-400/20 bg-sky-500/10 text-sky-300 shadow-[0_0_24px_rgba(14,165,233,0.12)]";
  }
}

export default function SupplyPage() {
  return (
    <PageShell
      title="Supply"
      subtitle="Una vista limpia para pedidos y stock."
      actions={
        <Link href="/dashboard" className="hocker-button-primary">
          Panel
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 rounded-[28px] border border-white/5 bg-slate-950/40 p-4 sm:p-5">
          <div className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-300">
            Supply visible
          </div>
        </div>

        <Hint title="Operación simple">
          La idea es ver rápido qué está listo, qué sigue y qué falta.
        </Hint>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {supply.map((card) => (
            <article
              key={card.title}
              className={`rounded-[26px] border p-5 shadow-[0_18px_60px_rgba(2,6,23,0.14)] backdrop-blur-xl ${accentClass(
                card.accent,
              )}`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em]">
                {card.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {card.desc}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hocker-panel-pro p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
              Ruta
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Flujo comercial
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Una vista que permite entender el avance sin buscar demasiado.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {roadmap.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">
                    Paso {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hocker-panel-pro p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
              Estado
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Diseño listo para crecer
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Todo va con espacio, aire y lectura rápida.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}