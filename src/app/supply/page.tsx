import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";

export const metadata: Metadata = {
  title: "Supply",
  description: "Supervisión de pedidos, inventario y línea comercial.",
};

const cards = [
  {
    title: "Pedidos",
    desc: "Todo más claro y fácil de leer.",
  },
  {
    title: "Inventario",
    desc: "Control simple de lo que entra y sale.",
  },
  {
    title: "Flujo",
    desc: "Cada paso conectado con el siguiente.",
  },
  {
    title: "Marca",
    desc: "Una presentación limpia y seria.",
  },
] as const;

const roadmap = [
  "Pedidos en marcha",
  "Inventario visible",
  "Estado de producción",
  "Salida a entrega",
];

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
          <BrandMark compact />
          <div className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-300">
            Supply visible
          </div>
        </div>

        <Hint title="Operación simple">
          La idea es ver rápido qué está listo, qué sigue y qué falta.
        </Hint>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.14)] backdrop-blur-xl"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
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
          </div>
        </section>
      </div>
    </PageShell>
  );
}