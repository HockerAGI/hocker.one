import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import SystemStatus from "@/components/SystemStatus";
import EventsFeed from "@/components/EventsFeed";

export const metadata: Metadata = {
  title: "Visión Global",
  description: "Centro de control táctico para supervisar el ecosistema Hocker One.",
};

const metrics = [
  {
    label: "Estado General",
    value: "Activo",
    desc: "Soberanía digital confirmada",
  },
  {
    label: "Núcleo NOVA",
    value: "En Línea",
    desc: "Orquestación central funcionando",
  },
  {
    label: "Nodos",
    value: "Sincronizados",
    desc: "Telemetría activa",
  },
  {
    label: "Operación",
    value: "Nominal",
    desc: "Flujo estable y trazable",
  },
];

const pillars = [
  {
    title: "Dirección Estratégica",
    desc: "Auditoría total del ecosistema, priorización de objetivos y decisiones de alto impacto.",
  },
  {
    title: "Fuerza Comercial",
    desc: "Lectura de leads, oportunidades y conversión con foco en ROI.",
  },
  {
    title: "Atención Soberana",
    desc: "Gestión unificada de experiencia y soporte con contexto persistente.",
  },
  {
    title: "Logística Operativa",
    desc: "Inventario, suministro y estados de entrega con trazabilidad total.",
  },
  {
    title: "Motor de Automatización",
    desc: "Menos fricción, más velocidad y ejecución repetible sin ruido.",
  },
  {
    title: "Identidad de Marca",
    desc: "Consistencia visual y verbal en cada pantalla y cada salida.",
  },
];

export default function DashboardPage() {
  return (
    <PageShell
      title="Visión Global"
      subtitle="Centro de control táctico para supervisar, decidir y orquestar el crecimiento del ecosistema."
      actions={
        <Link
          href="/chat"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Contactar a NOVA
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Hint title="Estado de la Matriz">
            Estás dentro del núcleo de operaciones. Aquí se supervisa el sistema, la lógica de decisión y la salud de los nodos en tiempo real.
          </Hint>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {metrics.map((item) => (
            <div key={item.label} className="hocker-card p-5">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">
                {item.label}
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-white">
                {item.value}
              </div>
              <div className="mt-1 text-sm text-slate-400">{item.desc}</div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="xl:col-span-8">
            <section className="hocker-card p-6 md:p-8">
              <div className="flex flex-col gap-3 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-sky-300">
                    Hocker One
                  </div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                    Fuerzas del Ecosistema
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Módulos clave que sostienen la operación diaria y el crecimiento comercial.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {pillars.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[22px] border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-sky-400/20 hover:bg-white/10"
                  >
                    <div className="text-lg font-black tracking-tight text-white">{item.title}</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-300">{item.desc}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="xl:col-span-4 flex flex-col gap-8">
            <SystemStatus />
            <EventsFeed />
          </aside>
        </div>

        <section className="hocker-glass rounded-[32px] p-6 md:p-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-sky-300">
                Evolución Omni-Sync
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                Hoja de Ruta de Integración
              </h2>
            </div>

            <Link
              href="/governance"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-sky-300"
            >
              Auditoría de Seguridad
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Asistente Central en Vivo",
              "Canales Externos Conectados",
              "Seguimiento Unificado",
              "Automatizaciones por Área",
            ].map((text) => (
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