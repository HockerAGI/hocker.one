import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import Link from "next/link";

const stats = [
  { label: "Estado general", value: "Activo", desc: "Visión privada del ecosistema" },
  { label: "Asistente central", value: "Listo", desc: "Entrada a NOVA" },
  { label: "Nodos", value: "Conectables", desc: "Control distribuido" },
  { label: "Operación", value: "Ordenada", desc: "Flujo unificado" },
];

const areas = [
  {
    title: "Dirección",
    desc: "Ver el estado del ecosistema, priorizar acciones y tomar decisiones con más claridad.",
  },
  {
    title: "Ventas",
    desc: "Dar seguimiento a oportunidades, conversaciones y cierres con una lectura más simple.",
  },
  {
    title: "Atención",
    desc: "Responder con más orden, más rapidez y más consistencia en cada punto de contacto.",
  },
  {
    title: "Operación",
    desc: "Tener una vista limpia de lo que ya funciona y de lo que todavía falta activar.",
  },
  {
    title: "Automatización",
    desc: "Reducir fricción y ganar velocidad en tareas repetitivas.",
  },
  {
    title: "Marca",
    desc: "Mantener una experiencia premium, sólida y fácil de reconocer.",
  },
];

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Centro de control privado para ver, decidir y avanzar con claridad."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Abrir asistente
          </Link>
        </div>
      }
    >
      <div className="grid gap-6">
        <Hint title="Estado actual">
          Esta versión muestra la base de tu ecosistema de forma privada y ordenada. Lo que ya
          está disponible aparece listo; lo que falta se muestra claramente como pendiente.
        </Hint>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                {item.label}
              </div>
              <div className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {item.value}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {areas.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-lg font-black tracking-tight text-slate-950">{item.title}</div>
              <div className="mt-2 text-sm leading-7 text-slate-600">{item.desc}</div>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Siguiente paso
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Lo que falta por conectar
              </h2>
            </div>
            <Link href="/governance" className="text-sm font-bold text-sky-700 hover:underline">
              Ver seguridad →
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Asistente central en vivo",
              "Canales externos conectados",
              "Seguimiento unificado de resultados",
              "Automatizaciones por área",
            ].map((text) => (
              <div
                key={text}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
              >
                Pendiente: {text}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}