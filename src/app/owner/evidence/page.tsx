import type { Metadata } from "next";
import { EvidencePanel } from "@/components/hocker-2c";
import { OwnerShell, OwnerSimplePage } from "@/components/hocker-2c/owner";

export const metadata: Metadata = {
  title: "Evidencia | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerEvidencePage() {
  return (
    <OwnerShell
      title="Evidencia"
      description="Pruebas, cambios y resultados explicados en humano. Lo importante debe quedar guardado."
      rightPanel={
        <EvidencePanel
          items={[
            { label: "Regla", value: "Toda ejecución real genera evidencia" },
            { label: "Rollback", value: "Disponible cuando aplica" },
            { label: "Visibilidad", value: "Owner primero" },
          ]}
        />
      }
    >
      <OwnerSimplePage
        items={[
          {
            title: "Código",
            description: "Cambios en ramas, PRs, archivos y resultados de build.",
            status: "Preparado",
          },
          {
            title: "Campañas",
            description: "Propuestas, aprobaciones, creativos y reportes.",
            status: "Base",
          },
          {
            title: "Seguridad",
            description: "Alertas, permisos, sesiones y acciones protegidas.",
            status: "Protegido",
          },
          {
            title: "Finanzas",
            description: "Movimientos, presupuestos, ROI y decisiones sensibles.",
            status: "Bloqueado",
          },
        ]}
      />
    </OwnerShell>
  );
}
