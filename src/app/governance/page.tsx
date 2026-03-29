import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import GovernancePanel from "@/components/GovernancePanel";
import Link from "next/link";

export default function GovernancePage() {
  return (
    <PageShell
      title="Núcleo de Gobernanza"
      subtitle="Gestión de políticas de seguridad, estados de emergencia y protocolos de autoridad."
      actions={
        <Link
          href="/commands"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98]"
        >
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Protocolos de Ejecución
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Aviso de control crítico con entrada cinemática */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Hint title="Jurisdicción de Vertx">
            Este sector gobierna el comportamiento profundo del Automation Fabric. Cualquier modificación en el Kill Switch o en los permisos de escritura afectará instantáneamente a todos los nodos conectados. Procede con precisión quirúrgica.
          </Hint>
        </div>
        
        {/* Panel de Gobernanza Central */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <GovernancePanel />
        </div>
      </div>
    </PageShell>
  );
}
