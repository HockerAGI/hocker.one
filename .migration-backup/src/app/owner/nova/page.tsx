import type { Metadata } from "next";
import { EvidencePanel } from "@/components/hocker-2c";
import { OwnerShell } from "@/components/hocker-2c/owner";
import { OwnerNovaBridge } from "@/components/hocker-2c/owner/nova";

export const metadata: Metadata = {
  title: "NOVA Owner | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerNovaPage() {
  return (
    <OwnerShell
      title="NOVA"
      description="La entrada owner para pedir, ordenar, analizar y preparar acciones. Nada real se ejecuta sin aprobación."
      rightPanel={
        <EvidencePanel
          title="Regla owner"
          description="NOVA puede preparar acciones. Lo real requiere aprobación."
          items={[
            { label: "Chat operativo", value: "Activo" },
            { label: "Modos", value: "Normal · Crear · Analizar · Ejecutar" },
            { label: "Ejecución", value: "Con Owner Gate" },
            { label: "Evidencia", value: "Obligatoria" },
          ]}
        />
      }
    >
      <OwnerNovaBridge />
    </OwnerShell>
  );
}
