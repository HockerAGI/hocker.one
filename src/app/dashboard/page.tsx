import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
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
      title="Centro de Mando Global"
      subtitle="Supervisión táctica y telemetría en tiempo real del ecosistema."
    >
      <div className="flex flex-col gap-8">
        {/* HUD DE MÉTRICAS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {metrics.map((m, i) => (
            <div key={i} className="hocker-panel-pro relative overflow-hidden p-6 group">
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition-opacity group-hover:opacity-100 ${m.ok ? 'bg-emerald-500/10 opacity-50' : 'bg-rose-500/10 opacity-50'}`} />
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.label}</div>
                <div className={`mt-1 text-2xl font-black tracking-tight drop-shadow-[0_0_8px_currentColor] ${m.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {m.value}
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-400">{m.desc}</div>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* COLUMNA PRINCIPAL: PILARES Y EVENTOS */}
          <div className="flex flex-col gap-8 lg:col-span-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <section className="hocker-glass-vfx p-8 relative">
              <div className="absolute top-8 right-8 opacity-20 hidden sm:block pointer-events-none">
                <BrandMark compact />
              </div>
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Evolución Omni-Sync</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow-md">Hoja de Ruta de Integración</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {pillars.map((p, i) => (
                    <div key={i} className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 transition hover:bg-slate-900/60 hover:border-sky-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse-slow" />
                        <h3 className="text-sm font-black text-white">{p.title}</h3>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-400">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Bitácora de Eventos</h3>
              </div>
              <EventsFeed />
            </section>
          </div>

          {/* COLUMNA LATERAL: SALUD DEL SISTEMA */}
          <aside className="flex flex-col gap-8 lg:col-span-4 animate-in fade-in slide-in-from-right-4 duration-700">
            <SystemStatus />
            <div className="hocker-panel-pro p-6 flex flex-col items-center text-center justify-center min-h-[200px] border-sky-500/20">
              <BrandMark showWordmark hero={false} className="scale-90 opacity-80" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400/80">Conciencia Unificada Operativa</p>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
