import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import Link from "next/link";

const prompts = [
  "Quiero un resumen del estado general.",
  "Muéstrame qué está listo y qué falta.",
  "Ayúdame a priorizar la próxima acción.",
  "Genera una respuesta para el equipo.",
];

const states = [
  {
    title: "Asistente central",
    desc: "Tu puerta de entrada para conversar con NOVA.",
  },
  {
    title: "Conexión directa",
    desc: "Cuando esta capa esté enlazada, aquí entrará la experiencia operativa completa.",
  },
  {
    title: "Estado visible",
    desc: "Si algo no está conectado, aparecerá como pendiente, sin ambigüedad.",
  },
];

export default function ChatPage() {
  return (
    <PageShell
      title="Asistente"
      subtitle="Un espacio privado para dialogar, ordenar ideas y activar el siguiente paso."
      actions={
        <Link
          href="/dashboard"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Volver al panel
        </Link>
      }
    >
      <div className="grid gap-6">
        <Hint title="Experiencia del asistente">
          Esta pantalla está pensada como el punto de arranque del diálogo con tu sistema.
          Cuando la conexión esté lista, aquí podrás mover tareas, prioridades y decisiones.
        </Hint>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              Entrada privada
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Habla con el centro de mando
            </h2>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-700">Mensaje sugerido</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                “Necesito el estado actual del ecosistema y qué tengo que mover primero.”
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {prompts.map((text) => (
                <div
                  key={text}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
                >
                  {text}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              Pendiente: conexión directa con el motor de conversación central.
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              Estado del canal
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Lo que verás cuando esté activo
            </h3>

            <div className="mt-5 grid gap-3">
              {states.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 p-4">
                  <div className="font-extrabold text-slate-950">{item.title}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Si todavía no tienes la experiencia conectada, el panel la muestra como pendiente
              para que no haya confusión.
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}