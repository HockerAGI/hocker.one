import type { Metadata } from "next";
import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export const metadata: Metadata = {
  title: "Hocker ONE · Sistema operativo conversacional",
  description: "Hocker ONE coordina NOVA, AGIs, aprobación owner, evidencia y acciones reales bajo una experiencia privada y segura.",
};

export default function OnePage() {
  return (
    <HockerPublicPage
      eyebrow="Hocker ONE"
      title="Sistema operativo conversacional para operar con NOVA."
      description="Una capa privada para pedir trabajo, revisar evidencia, aprobar acciones y mantener control operativo sin exponer módulos internos."
      primaryHref="/login"
      primaryLabel="Entrar al panel"
      secondaryHref="/ecosistema"
      secondaryLabel="Ver ecosistema"
      cards={[
        { title: "NOVA como interfaz", text: "Conversación primero. El sistema interno queda en backstage." },
        { title: "Owner Gate", text: "Las acciones reales esperan aprobación y evidencia antes de ejecutarse." },
        { title: "Ejecución protegida", text: "GitHub, memoria, integraciones y auditoría operan con límites claros." },
      ]}
    />
  );
}
