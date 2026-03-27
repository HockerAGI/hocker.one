import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import Link from "next/link";

const nodes = [
  {
    title: "Nodo principal",
    desc: "Punto de control del ecosistema.",
    state: "Listo para enlazar",
  },
  {
    title: "Nodo de respaldo",
    desc: "Apoyo operativo cuando el principal no está disponible.",
    state: "Pendiente de activación",
  },
  {
    title: "Nodo cloud",
    desc: "Extensión remota para automatizaciones y servicios.",
    state: "Conectable",
  },
  {
    title: "Nodo fabric",
    desc: "Capa distribuida para sincronización y estado.",
    state: "Visible",
  },
];

export default function NodesPage() {
  return (
    <PageShell
      title="Nodos"
      subtitle="Una vista clara de los puntos de control que sostienen tu operación."
      actions={
        <Link
          href="/dashboard"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Panel
        </Link>
      }
    >
      <div className="grid gap-6">
        <Hint title="Visibilidad de red">
          Aquí se entiende qué nodo está disponible, cuál está pendiente y cómo se ordena la
          operación. Sin ruido, sin confusión.
        </Hint>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {nodes.map((node) => (
            <div key={node.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-black tracking-tight text-slate-950">{node.title}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">{node.desc}</div>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                  {node.state}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            Estado de conexión
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Lo que falta por enlazar
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              "Nodo principal real",
              "Nodo de respaldo operativo",
              "Nodos cloud visibles en tiempo real",
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