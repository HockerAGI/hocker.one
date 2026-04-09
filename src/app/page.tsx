import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PageShell from "@/components/PageShell";
import AuthBox from "@/components/AuthBox";
import SystemStatus from "@/components/SystemStatus";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Entrada principal de Hocker ONE.",
};

const featureCards = [
  {
    title: "Control unificado",
    text: "Todo el ecosistema en una sola pantalla, sin ruido ni rutas confusas.",
  },
  {
    title: "Acceso seguro",
    text: "Login con contraseña o enlace rápido, listo para operar en segundos.",
  },
  {
    title: "Marca visible",
    text: "Logo completo e isotipo integrados con presencia fuerte y limpia.",
  },
  {
    title: "Estado en vivo",
    text: "Salud, nodos y actividad presentados con jerarquía clara.",
  },
];

export default function HomePage() {
  return (
    <PageShell
      title="Inicio"
      subtitle="Una experiencia clara, premium y lista para operar desde el primer clic."
      actions={
        <>
          <Link href="/chat" className="hocker-button-brand">
            Abrir NOVA
          </Link>
          <Link href="/dashboard" className="hocker-button-primary">
            Vista rápida
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <section className="relative overflow-hidden rounded-[34px] border border-white/5 bg-slate-950/70 p-5 shadow-[0_18px_90px_rgba(2,6,23,0.25)] sm:p-7 hocker-page-enter">
          <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 hocker-grid-soft opacity-[0.05]" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <BrandMark hero className="scale-[1.01]" />

              <div className="max-w-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
                  Centro de mando
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl font-display">
                  Marca fuerte.
                  <br />
                  Navegación limpia.
                  <br />
                  Acción directa.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  Hocker ONE concentra control, acceso y seguimiento en una interfaz hecha para verse seria, sentirse premium y entenderse al instante.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Listo", "Vivo", "Seguro", "Rápido"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {featureCards.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[24px] border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-sky-500/20 hover:bg-white/[0.05]"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/5 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                  Experiencia
                </p>
                <p className="mt-2 text-2xl font-black text-white font-display">
                  Premium
                </p>
              </div>
              <div className="rounded-[24px] border border-white/5 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                  Navegación
                </p>
                <p className="mt-2 text-2xl font-black text-white font-display">
                  Simple
                </p>
              </div>
              <div className="rounded-[24px] border border-white/5 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                  Control
                </p>
                <p className="mt-2 text-2xl font-black text-white font-display">
                  Total
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <AuthBox />

          <div className="rounded-[32px] border border-white/5 bg-slate-950/70 p-5 shadow-[0_18px_90px_rgba(2,6,23,0.2)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
                  Estado en vivo
                </p>
                <h3 className="mt-2 text-xl font-black text-white font-display">
                  Salud del sistema
                </h3>
              </div>
              <span className="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-emerald-300">
                Online
              </span>
            </div>

            <SystemStatus />
          </div>
        </section>
      </div>
    </PageShell>
  );
}