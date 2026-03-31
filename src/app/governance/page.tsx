import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import GovernancePanel from "@/components/GovernancePanel";

export const metadata: Metadata = {
  title: "Gobernanza",
};

export default function GovernancePage() {
  return (
    <PageShell title="Seguridad Soberana" subtitle="Gestión de políticas, kill-switches y protocolos de autoridad.">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 w-full">
        <Hint title="Protocolo de Emergencia">
          La activación del Kill Switch detendrá inmediatamente todas las transmisiones de los agentes y revocará los tokens de acceso de los nodos.
        </Hint>
        
        <div className="animate-in fade-in zoom-in duration-500">
          <GovernancePanel />
        </div>
      </div>
    </PageShell>
  );
}
