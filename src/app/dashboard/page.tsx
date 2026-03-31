import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import SystemStatus from "@/components/SystemStatus";
import EventsFeed from "@/components/EventsFeed";

export const metadata: Metadata = {
  title: "Visión Global",
  description: "Centro de control táctico para supervisar el ecosistema Hocker One.",
};

const metrics = [
  { label: "Estado General", value: "ACTIVO", color: "text-emerald-400", glow: "shadow-emerald-500/20" },
  { label: "Núcleo NOVA", value: "EN LÍNEA", color: "text-sky-400", glow: "shadow-sky-500/20" },
  { label: "Nodos", value: "SYNC", color: "text-sky-400", glow: "shadow-sky-500/20" },
  { label: "Operación", value: "NOMINAL", color: "text-emerald-400", glow: "shadow-emerald-500/20" },
];

export default function DashboardPage() {
  return (
    <PageShell title="Visión Global" subtitle="Supervisión en tiempo real del ecosistema unificado.">
      <div className="flex flex-col gap-8">
        
        {/* TELEMETRÍA SUPERIOR */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className={`hocker-panel-pro p-4 flex flex-col items-center justify-center text-center border-white/5 ${m.glow}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{m.label}</span>
              <span className={`text-xl font-black tracking-tighter ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* COLUMNA PRINCIPAL: EVENTOS */}
          <div className="lg:col-span-8">
            <EventsFeed />
          </div>

          {/* COLUMNA LATERAL: ESTADO Y GUÍAS */}
          <aside className="flex flex-col gap-8 lg:col-span-4">
            <SystemStatus />
            <Hint title="Directiva de Mando">
              Mantén el monitoreo de los eventos de telemetría. Cualquier anomalía en los nodos se reflejará instantáneamente en el log de la izquierda.
            </Hint>
          </aside>
        </div>

        {/* ROADMAP / PILARES */}
        <section className="hocker-glass-vfx p-8 mt-4">
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-sky-400">Roadmap de Integración</h3>
            <p className="text-slate-400 text-sm mt-1 font-medium">Evolución de la Matriz Omni-Sync</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Asistente Central", "Canales Conectados", "Seguimiento Unificado", "Automatización Total"].map((step, i) => (
              <div key={step} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-sky-500/50 font-black text-2xl italic">0{i+1}</span>
                <span className="text-sm font-bold text-slate-200">{step}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
