import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import Link from "next/link";

const queues = [
  { title: "Pendientes", value: "Ordenados", desc: "Acciones que esperan validación" },
  { title: "Aprobados", value: "Preparados", desc: "Listos para ejecución" },
  { title: "Rechazados", value: "Registrados", desc: "Con trazabilidad visible" },
  { title: "Seguimiento", value: "Activo", desc: "Control del flujo de decisiones" },
];

const stages = [
  "Recepción",
  "Revisión",
  "Aprobación",
  "Ejecución",
  "Seguimiento",
];

export default function CommandsPage() {
  return (
    <PageShell
      title="Acciones"
      subtitle="Donde el sistema organiza lo que se debe hacer, revisar o aprobar."
      actions={
        <Link
          href="/governance"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Gobernanza
        </Link>
      }
    >
      <div className="grid gap-6">
        <Hint title="Flujo de trabajo">
          Esta sección reúne la cola de acciones en un lenguaje simple: qué entra, qué se revisa,
          qué avanza y qué queda listo para ejecutar.
        </Hint>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {queues.map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                {item.title}
              </div>
              <div className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {item.value}
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</div>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            Cadena de avance
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            De la idea a la acción
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {stages.map((stage, index) => (
              <div
                key={stage}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                  0{index + 1}
                </div>
                <div className="mt-1">{stage}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            Pendiente: conectar ejecución directa según tus reglas de aprobación.
          </div>
        </section>
      </div>
    </PageShell>
  );
}