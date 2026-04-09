import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import SystemStatus from "@/components/SystemStatus";
import EventsFeed from "@/components/EventsFeed";
import NodesPanel from "@/components/NodesPanel";
import AgisRegistry from "@/components/AgisRegistry";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Resumen visual del ecosistema.",
};

const overviewStats = [
  { label: "Panel", value: "Control" },
  { label: "Estado", value: "Live" },
  { label: "Visibilidad", value: "Total" },
  { label: "Nodos", value: "Activos" },
];

const quickLinks = [
  { href: "/chat", title: "NOVA", desc: "Conversa con el núcleo." },
  { href: "/commands", title: "Acciones", desc: "Gestiona órdenes." },
  { href: "/nodes", title: "Nodos", desc: "Monitorea ejecución." },
  { href: "/agis", title: "AGIs", desc: "Explora inteligencias." },
  { href: "/governance", title: "Seguridad", desc: "Control de escritura." },
  { href: "/supply", title: "Supply", desc: "Operación comercial." },
];

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Todo el ecosistema en una sola vista, sin ruido y con jerarquía clara."
      actions={
        <Link href="/chat" className="hocker-button-brand">
          Abrir NOVA
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-slate-950/70 p-5 shadow-[0_18px_100px_rgba(2,6,23,0.28)] sm:p-7">
          <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 hocker-grid-soft opacity-[0.06]" />

          <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
            <div className="space-y-6">
              <BrandMark hero className="px-0 py-0 shadow-none" />

              <div className="max-w-3xl space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.38em] text-sky-300">
                  Centro de mando
                </p>
                <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl font-display">
                  Lectura rápida.
                  <br />
                  Control limpio.
                  <br />
                  Decisión precisa.
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  Hocker ONE fue hecho para entenderse al instante: qué está vivo, qué necesita atención y dónde actuar sin perder tiempo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {overviewStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-white/5 bg-white/[0.03] p-4"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-black text-white font-display">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Hint title="Estado operativo" tone="emerald">
                Todo se ve en una sola lectura: salud del sistema, actividad reciente, nodos y células activas.
              </Hint>

              <div className="grid grid-cols-2 gap-3">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-[24px] border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-500/20 hover:bg-white/[0.05]"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-300">
                      {item.desc}
                    </p>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-sky-300">
                      Abrir
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <div className="space-y-6">
              <div className="hocker-panel-pro p-5">
                <SystemStatus />
              </div>

              <div className="hocker-panel-pro p-5">
                <AgisRegistry title="Células activas" />
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 space-y-6">
            <div className="hocker-panel-pro p-5">
              <EventsFeed />
            </div>

            <div className="hocker-panel-pro p-5">
              <NodesPanel />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}