import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NovaChat from "@/components/NovaChat";
import Link from "next/link";
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
          Esta pantalla ya conversa con tu motor privado. Si algo no está conectado, NOVA te lo
          va a decir sin rodeos.
        </Hint>
        <NovaChat />
      </div>
    </PageShell>
  );
}