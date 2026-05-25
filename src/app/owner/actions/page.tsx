import type { Metadata } from "next";
import { EvidencePanel } from "@/components/hocker-2c";
import { OwnerShell } from "@/components/hocker-2c/owner";
import { OwnerActionsLivePanel } from "@/components/hocker-2c/owner/live";

export const metadata: Metadata = {
  title: "Pendientes | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerActionsPage() {
  return (
    <OwnerShell
      title="Pendientes"
      description="Acciones reales disponibles para revisión. Si no hay datos, la vista lo dirá sin inventar nada."
      rightPanel={
        <EvidencePanel
          items={[
            { label: "Nombre humano", value: "Pendientes" },
            { label: "Regla", value: "Nada se ejecuta sin aprobación" },
            { label: "Modo", value: "Lectura segura" },
          ]}
        />
      }
    >
      <OwnerActionsLivePanel />
    </OwnerShell>
  );
}
