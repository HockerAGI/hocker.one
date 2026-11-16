import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import VerifiableWorkersConsole from "@/components/workers/VerifiableWorkersConsole";
import FreeReadonlyPilotPanel from "@/components/workers/FreeReadonlyPilotPanel";
import FreeUnifiedWorkerCanaryPanel from "@/components/workers/FreeUnifiedWorkerCanaryPanel";

export const metadata: Metadata = {
  title: "Trabajadores AGI · Hocker ONE",
  description: "Cola, ejecución controlada, evidencia y trazabilidad de trabajadores especializados.",
};

export default function WorkersPage() {
  return (
    <PageShell
      title="Procesos AGI"
      subtitle="Estado real de los trabajos, revisión de pendientes y resultados de NOVA."
      compact
      className="hko-workers-page"
    >
      <VerifiableWorkersConsole />
      <FreeReadonlyPilotPanel />
      <FreeUnifiedWorkerCanaryPanel />
    </PageShell>
  );
}
