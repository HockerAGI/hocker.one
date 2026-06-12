import type { Metadata } from "next";
import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export const metadata: Metadata = {
  title: "Seguridad · HOCKER",
  description: "Principios públicos de seguridad de HOCKER: aprobación, auditoría, separación de capas y operación responsable.",
};

export default function SeguridadPage() {
  return (
    <HockerPublicPage
      eyebrow="Seguridad"
      title="Control, aprobación y evidencia antes de cualquier acción real."
      description="La operación sensible se separa por capas: público indexable, privado operativo y protegido crítico."
      primaryHref="/one"
      primaryLabel="Ver Hocker ONE"
      secondaryHref="/contacto"
      secondaryLabel="Contactar"
      cards={[
        { title: "Sin main directo", text: "Los cambios de código deben pasar por ramas, PR y evidencia." },
        { title: "Owner Gate", text: "Las acciones reales requieren aprobación explícita." },
        { title: "No simulaciones", text: "Si falta executor real, el sistema debe decirlo y preparar solo un plan." },
      ]}
    />
  );
}
