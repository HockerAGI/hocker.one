import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import GovernancePanel from "@/components/GovernancePanel";

export const metadata: Metadata = {
  title: "Gobernanza",
  description: "Gestión de políticas de seguridad, estados de emergencia y protocolos de autoridad.",
};

export default function GovernancePage() {
  return (
    <PageShell
      title="Núcleo de Gobernanza"
      subtitle="Gestión de políticas de seguridad, estados de emergencia y protocolos de autoridad."
      actions={
        <Link
          href="/commands"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Protocolos de Ejecución
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Jurisdicción de Vertx">
          Este sector gobierna el comportamiento profundo del Automation Fabric. Cambios en el Kill Switch o en Allow Write afectan a toda la matriz.
        </Hint>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GovernancePanel />
        </div>
      </div>
    </PageShell>
  );
}