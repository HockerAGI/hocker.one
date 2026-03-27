import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import AgisRegistry from "@/components/AgisRegistry";
import Link from "next/link";
export default function AgisPage() {
  return (
    <PageShell
      title="Agentes"
      subtitle="Jerarquía de inteligencias y funciones dentro de tu ecosistema."
      actions={
        <Link
          href="/chat"
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Asistente
        </Link>
      }
    >
      <div className="grid gap-6">
        <Hint title="Mente colmena">
          Esta pantalla agrupa las inteligencias por función. Cada una tiene su papel claro, sin
          mezclar responsabilidades.
        </Hint>
        <AgisRegistry />
      </div>
    </PageShell>
  );
}