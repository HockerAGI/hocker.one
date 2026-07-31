import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import VerifiableWorkersConsole from "@/components/workers/VerifiableWorkersConsole";

export const metadata: Metadata = {
  title: "Trabajadores AGI · Hocker ONE",
  description: "Cola, ejecución controlada, evidencia y trazabilidad de trabajadores especializados.",
};

export default function WorkersPage() {
  return (
    <PageShell
      title="Trabajadores AGI"
      subtitle="Asignación especializada, cola atómica, intentos, evidencia y resultados correlacionados con NOVA."
    >
      <VerifiableWorkersConsole />
    </PageShell>
  );
}
