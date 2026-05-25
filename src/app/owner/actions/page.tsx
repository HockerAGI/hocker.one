import type { Metadata } from "next";
import { ActionPreviewCard, EvidencePanel } from "@/components/hocker-2c";
import { OwnerShell } from "@/components/hocker-2c/owner";

export const metadata: Metadata = {
  title: "Pendientes | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerActionsPage() {
  return (
    <OwnerShell
      title="Pendientes"
      description="Acciones preparadas que necesitan revisión antes de ejecutarse. Nada sensible avanza sin permiso."
      rightPanel={
        <EvidencePanel
          items={[
            { label: "Nombre humano", value: "Pendientes" },
            { label: "Nombre interno", value: "Owner Gate" },
            { label: "Estado", value: "Seguro por defecto" },
          ]}
        />
      }
    >
      <ActionPreviewCard
        title="Ejemplo de acción lista para revisión"
        summary="Esta tarjeta muestra cómo deben verse las acciones reales: claras, con riesgo, destino y pasos."
        risk="low"
        target="Hocker ONE"
        steps={[
          "NOVA prepara el cambio.",
          "El owner revisa el resumen.",
          "El sistema ejecuta sólo si se aprueba.",
          "La evidencia queda guardada.",
        ]}
        requiresApproval
      />
    </OwnerShell>
  );
}
