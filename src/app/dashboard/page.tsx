import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import SystemStatus from "@/components/SystemStatus";
import EventsFeed from "@/components/EventsFeed";
import BrandMark from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Visión Global",
  description: "Centro de control táctico para supervisar el ecosistema Hocker One.",
};

const metrics = [
  { label: "Estado General", value: "ACTIVO", desc: "Soberanía digital confirmada", ok: true },
  { label: "Núcleo NOVA", value: "EN LÍNEA", desc: "Orquestación central estable", ok: true },
  { label: "Nodos", value: "SYNC", desc: "Telemetría activa", ok: true },
  { label: "Operación", value: "NOMINAL", desc: "Flujo de red continuo", ok: true },
];

const pillars = [
  { title: "Dirección Estratégica", desc: "Auditoría total del ecosistema y decisiones de alto impacto." },
  { title: "Fuerza Comercial", desc: "Lectura de leads, oportunidades y conversión con foco en ROI." },
  { title: "Atención Soberana", desc: "Gestión unificada de experiencia y soporte persistente." },
  { title: "Logística Operativa", desc: "Inventario, suministro y entregas en tiempo real." },
];

export default function DashboardPage() {
  return (
    <PageShell
      title="Centro de Mando"
      subtitle="Supervisión táctica y telemetría en tiempo real del ecosistema."
    >
      <div className="flex flex-col gap-8 sm:gap-10">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="hocker-panel-pro relative overflow-hidden p-5 sm:p-6 group transition-all hover:scale-[1.01]"
            >
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700 ${
                  m.ok ? "bg-emerald-500/5" : "bg-rose-500/5"
                }`}
              />
              <div
                className={`absolute -right-6 -top-6 h-24 w-24 sm:h-28 sm:w-28 rounded-full blur-3xl ${
                  m.ok ? "bg-emerald-500/20" : "bg-rose-500/20"
                }`}
              />

              <div className="relative z-10">
                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {m.label}
                </div>
                <div
                  className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight ${
                    m.ok ? "text-emerald-400" : "text-rose-400"
                  } drop-shadow-[0_0_12px_currentColor]`}
                >
                  {m.value}
                </div>
                <div className="mt-2 text-[11px] text-slate-400">{m.desc}</div>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-6 lg:col-span-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <section className="hocker-glass-vfx relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-0 bg-sky-500/5 opacity-0 hover:opacity-100 transition duration-700" />

              <div className="relative z-10">
                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">
                  Núcleo Estratégico
                </div>

                <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white hocker-text-glow">
                  Inteligencia Operativa
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {pillars.map((p) => (
                    <div
                      key={p.title}
                      className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 sm:p-5 transition-all hover:border-sky-500/30 hover:bg-slate-900/60 hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse-slow shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                        <h3 className="text-sm font-black text-white">{p.title}</h3>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Bitácora de eventos
              </h3>
              <EventsFeed />
            </section>
          </div>

          <aside className="flex flex-col gap-6 lg:col-span-4 animate-in fade-in slide-in-from-right-4 duration-700">
            <SystemStatus />

            <div className="hocker-panel-pro flex flex-col items-center justify-center border-sky-500/20 p-6 text-center">
              <BrandMark showWordmark hero={false} className="scale-90 opacity-80" />
              <p className="mt-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400/80">
                Conciencia Unificada Activa
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}