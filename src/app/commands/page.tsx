import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import SystemStatus from "@/components/SystemStatus";
import EventsFeed from "@/components/EventsFeed";
import Link from "next/link";

const stats = [
  { label: "Estado General", value: "Activo", desc: "Soberanía digital confirmada", color: "text-emerald-600" },
  { label: "Mente Colmena", value: "NOVA v2", desc: "Núcleo central en línea", color: "text-blue-600" },
  { label: "Nodos Activos", value: "Sincronizados", desc: "Control de activos distribuido", color: "text-sky-600" },
  { label: "Operación", value: "Nominal", desc: "Flujo de datos sin fricción", color: "text-indigo-600" },
];

const forces = [
  {
    title: "Dirección Estratégica",
    desc: "Auditoría total del ecosistema, priorización de objetivos y toma de decisiones de alto impacto.",
  },
  {
    title: "Fuerza de Ventas",
    desc: "Monitoreo de leads y conversiones mediante análisis predictivo de oportunidades.",
  },
  {
    title: "Atención Soberana",
    desc: "Gestión unificada de la experiencia del cliente con respuestas de alta precisión.",
  },
  {
    title: "Logística Operativa",
    desc: "Visión nítida de inventarios, suministros y el flujo de trabajo en tiempo real.",
  },
  {
    title: "Motor de Automatización",
    desc: "Ejecución de tareas repetitivas mediante el Automation Fabric para ganar velocidad crítica.",
  },
  {
    title: "Identidad de Marca",
    desc: "Preservación de la estética premium y la consistencia en cada punto de contacto.",
  },
];

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard de Operaciones"
      subtitle="Visión panorámica de las fuerzas y activos que componen Hocker One."
    >
      <div className="flex flex-col gap-8">
        
        {/* ==========================================
            SENSORES DE ESTADO (STATS)
            ========================================== */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {stats.map((item) => (
            <div key={item.label} className="hocker-card p-5 transition-all hover:scale-[1.02]">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.label}</div>
              <div className={`mt-2 text-2xl font-black tracking-tight ${item.color}`}>{item.value}</div>
              <div className="mt-1 text-sm text-slate-500">{item.desc}</div>
            </div>
          ))}
        </section>

        {/* ==========================================
            RADAR OPERATIVO Y SISTEMA
            ========================================== */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <section className="hocker-card p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6 mb-8">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">Fuerzas del Ecosistema</h2>
                  <p className="text-sm text-slate-500">Departamentos bajo la orquestación de la Mente Colmena.</p>
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                {forces.map((item) => (
                  <div key={item.title} className="group rounded-2xl border border-transparent p-4 transition-all hover:bg-slate-50/50 hover:border-slate-100">
                    <div className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 flex flex-col gap-8">
            <SystemStatus />
            <EventsFeed />
          </aside>
        </div>

        {/* ==========================================
            HOJA DE RUTA OPERATIVA (ROADMAP)
            ========================================== */}
        <section className="hocker-glass rounded-[32px] p-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 fill-mode-both">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Evolución Omni-Sync</div>
              <h2 className="mt-2 text-3xl font-black tracking-tighter text-slate-950">Hoja de Ruta Operativa</h2>
            </div>
            <Link href="/governance" className="group flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Seguridad del Sistema
              <svg className="h-4 w-4 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Asistente Central en Vivo",
              "Canales Externos Conectados",
              "Seguimiento Unificado",
              "Automatizaciones de Nodo",
            ].map((text) => (
              <div key={text} className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-4 text-sm font-bold text-blue-900 shadow-sm transition-all hover:bg-blue-50">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                {text}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
