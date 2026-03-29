import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import AuthBox from "@/components/AuthBox";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Hocker ONE",
  description: "Centro privado para operar NOVA, el ecosistema HOCKER y sus módulos clave.",
};

const pillars = [
  {
    title: "Control claro",
    body:
      "Un solo punto de entrada para ver el estado del sistema, tomar decisiones y mover el ecosistema con orden.",
  },
  {
    title: "Diseño premium",
    body:
      "Interfaz oscura, limpia y elegante, pensada primero para celular y luego para escritorio, sin paneles saturados.",
  },
  {
    title: "Operación real",
    body:
      "Mensajes, comandos, nodos, logística y permisos conectados en una sola base para evitar duplicidad y errores.",
  },
];

const modules = [
  {
    name: "NOVA Core",
    text: "Centro de mando, conversación y decisiones estratégicas.",
  },
  {
    name: "Control H",
    text: "Vista ejecutiva con accesos, métricas y atajos importantes.",
  },
  {
    name: "Hocker Hub",
    text: "CRM, seguimiento y operación comercial en un solo flujo.",
  },
  {
    name: "HKR Supply",
    text: "Catálogo, órdenes y trazabilidad con lectura simple.",
  },
  {
    name: "Vertx / Jurix / Numia",
    text: "Seguridad, legal y finanzas alineadas al mismo control.",
  },
  {
    name: "Red de nodos",
    text: "Visibilidad sobre agentes, salud y actividad del sistema.",
  },
];

export default function HomePage() {
  return (
    <PageShell
      title="Hocker ONE"
      subtitle="Acceso privado al centro operativo de NOVA. Entra, valida tu sesión y continúa al tablero principal."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M12 4l8 8-8 8" />
          </svg>
          Abrir dashboard
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <section className="xl:col-span-7">
          <div className="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-slate-950/40 p-5 shadow-xl shadow-black/20 backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <BrandMark hero />
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.28em] text-sky-300/90">
                  Soberanía digital • UX premium • operación real
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Un centro privado que se siente limpio, rápido y serio.
                </h2>
                <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-300">
                  Aquí no se mezcla todo. Primero entras, luego validas acceso y después pasas al tablero operativo.
                  Así la experiencia se ve mejor en móvil, carga más limpio y evita ruido visual.
                </p>
              </div>

              <div className="grid w-full max-w-sm grid-cols-2 gap-3 rounded-[24px] border border-white/10 bg-white/5 p-3 text-left sm:max-w-md">
                {[
                  ["Estado", "Preparado para control"],
                  ["Enfoque", "Móvil primero"],
                  ["Lectura", "Simple y ejecutiva"],
                  ["Escala", "Web y app"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {pillars.map((item) => (
                <article key={item.title} className="rounded-[24px] border border-white/10 bg-slate-900/60 p-5">
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p>
                </article>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {modules.map((module) => (
                <article
                  key={module.name}
                  className="rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-900/85 to-slate-950/55 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-sky-400/25 hover:shadow-lg hover:shadow-sky-500/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-[0.24em] text-sky-300">{module.name}</h3>
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_0_6px_rgba(14,165,233,0.12)]" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{module.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="xl:col-span-5">
          <div className="sticky top-6 flex flex-col gap-5">
            <AuthBox />

            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/30 backdrop-blur-2xl">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-slate-400">
                Accesos rápidos
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  href="/dashboard"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Ir al tablero
                </Link>
                <Link
                  href="/chat"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Abrir NOVA
                </Link>
                <Link
                  href="/supply"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Ver Supply
                </Link>
                <Link
                  href="/commands"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Cola de órdenes
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}