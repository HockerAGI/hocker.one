import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import Link from "next/link";
const supply = [
  {
    title: "Catálogo",
    desc: "Productos y servicios listos para mostrar.",
  },
  {
    title: "Órdenes",
    desc: "Pedidos, estado y seguimiento.",
  },
  {
    title: "Inventario",
    desc: "Lo disponible y lo pendiente.",
  },
  {
    title: "Logística",
    desc: "Movimiento interno y entrega.",
  },
];
const missing = [
  "Productos reales cargados",
  "Órdenes activas sincronizadas",
  "Inventario visible por proyecto",
  "Flujo de logística conectado",
];
export default function SupplyPage() {
  return (
    <PageShell
      title="Supply"
      subtitle="La capa donde se ordena catálogo, operación y seguimiento."
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
        <Hint title="Operación visible">
          Aquí se concentra la estructura comercial y operativa para que cada entrega tenga
          trazabilidad y orden.
        </Hint>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {supply.map((item) => (
            <div key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-black tracking-tight text-slate-950">{item.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</div>
            </div>
          ))}
        </section>
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            Faltante por conectar
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Para dejarlo completo
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {missing.map((text) => (
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