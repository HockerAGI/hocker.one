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
    desc: "Reducir fricción y ganar velocidad en tareas repetitivas mediante el Automation Fabric.",
  },
  {
    title: "Identidad de Marca",
    desc: "Preservación de la estética premium y la consistencia en cada punto de contacto.",
  },
];

export default function DashboardPage() {
  return (
    <PageShell
      title="Visión Global"
      subtitle="Centro de control táctico para supervisar, decidir y orquestar el crecimiento del proyecto."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98]"
          >
            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Contactar a NOVA
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        
        {/* Aviso Táctico con entrada suave */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Hint title="Estado de la Matriz">
            Has accedido al núcleo de operaciones de Hocker One. Desde aquí supervisas tanto el casino como la infraestructura logística. Recuerda que cada decisión aquí impacta en la sincronía de los nodos.
          </Hint>
        </div>

        {/* Sensores de Estado (Stats) */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {stats.map((item) => (
            <div key={item.label} className="hocker-card p-5 transition-all hover:scale-[1.02]">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.label}</div>
              <div className={`mt-2 text-2xl font-black tracking-tight ${item.color}`}>{item.value}</div>
              <div className="mt-1 text-sm text-slate-500">{item.desc}</div>
            </div>
          ))}
        </section>

        {/* Radar Operativo y Sistema */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <section className="hocker-card p-8">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 mb-8">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Fuerzas del Ecosistema</h2>
                <p className="text-sm text-slate-500">Departamentos bajo la orquestación directa de la Mente Colmena.</p>
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

        {/* Hoja de Ruta Operativa */}
        <section className="hocker-glass rounded-[32px] p-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 fill-mode-both">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Evolución Omni-Sync</div>
              <h2 className="mt-2 text-3xl font-black tracking-tighter text-slate-950">Hoja de Ruta de Integración</h2>
            </div>
            <Link href="/governance" className="group flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Auditoría de Seguridad
              <svg className="h-4 w-4 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Asistente Central en Vivo",
              "Canales Externos Conectados",
              "Seguimiento Unificado",
              "Automatizaciones por Área",
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
