import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandsQueue from "@/components/CommandsQueue";
import Link from "next/link";
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
          Esta sección muestra la cola real de comandos, sus estados y las decisiones pendientes.
        </Hint>
        <CommandsQueue />
      </div>
    </PageShell>
  );
}