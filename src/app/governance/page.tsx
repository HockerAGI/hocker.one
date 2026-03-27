import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import Link from "next/link";

const controls = [
  {
    title: "Acceso",
    desc: "Quién entra y desde dónde.",
  },
  {
    title: "Aprobación",
    desc: "Qué acciones requieren revisión.",
  },
  {
    title: "Auditoría",
    desc: "Registro claro de eventos.",
  },
  {
    title: "Bloqueo",
    desc: "Capacidad de detener operación cuando hace falta.",
  },
];

const pending = [
  "Validación de permisos por rol",
  "Registro de eventos en vivo",
  "Conexión de apagado controlado",
  "Seguimiento completo de decisiones",
];

export default function GovernancePage() {
  return (
    <PageShell
      title="Gobernanza"
      subtitle="La capa que mantiene el orden, los permisos y la trazabilidad."
      actions={
        <Link
          href="/commands"
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Acciones
        </Link>
      }
    >
      <div className="grid gap-6">
        <Hint title="Control serio">
          Esta sección sirve para mantener la operación bajo reglas claras. No está pensada para
          adornar; está pensada para proteger y ordenar.
        </Hint>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {controls.map((item) => (
            <div key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-black tracking-tight text-slate-950">{item.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</div>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            Pendiente por cerrar
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Lo que falta para dejarlo completo
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {pending.map((text) => (
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