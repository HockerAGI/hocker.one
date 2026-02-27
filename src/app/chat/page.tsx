import PageShell from "@/components/PageShell";
import NovaChat from "@/components/NovaChat";

export default function ChatPage() {
  return (
    <PageShell
      title="Chat NOVA"
      subtitle="Escribe o dicta. NOVA responde y (si está permitido) crea acciones en la cola."
      actions={
        <a
          href="/commands"
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          title="Ir a Acciones"
        >
          Ver acciones
        </a>
      }
    >
      <NovaChat />
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <b>Nota:</b> Si activas “Permitir acciones”, NOVA podrá encolar tareas. Si quieres bloquear TODO, usa el Kill Switch en <a className="font-semibold text-blue-700 hover:underline" href="/governance">Seguridad</a>.
      </div>
    </PageShell>
  );
}
