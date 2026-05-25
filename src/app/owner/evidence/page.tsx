import type { Metadata } from "next";
import { EvidencePanel } from "@/components/hocker-2c";
import { OwnerShell } from "@/components/hocker-2c/owner";
import { OwnerEvidenceLivePanel } from "@/components/hocker-2c/owner/live";

export const metadata: Metadata = {
  title: "Evidencia | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerEvidencePage() {
  return (
    <OwnerShell
      title="Evidencia"
      description="Pruebas, cambios y resultados explicados en humano. Esta vista sólo lee información disponible."
      rightPanel={
        <EvidencePanel
          items={[
            { label: "Regla", value: "Toda ejecución real debe generar evidencia" },
            { label: "Acción", value: "Sólo lectura" },
            { label: "Visibilidad", value: "Owner primero" },
          ]}
        />
      }
    >
      <OwnerEvidenceLivePanel />
    </OwnerShell>
  );
}
