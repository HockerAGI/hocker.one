import type { Metadata } from "next";
import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export const metadata: Metadata = {
  title: "Ecosistema HOCKER",
  description: "Mapa público del ecosistema HOCKER: IA, automatización, publicidad, plataformas, seguridad y operación digital.",
};

export default function EcosistemaPage() {
  return (
    <HockerPublicPage
      eyebrow="Ecosistema"
      title="IA, publicidad, automatización y operación conectadas."
      description="HOCKER integra herramientas, AGIs y plataformas para convertir estrategia, contenido, código y operación en sistemas medibles."
      primaryHref="/soluciones"
      primaryLabel="Ver soluciones"
      secondaryHref="/one"
      secondaryLabel="Ver Hocker ONE"
      cards={[
        { title: "Marketing e IA", text: "Campañas, branding, contenido y automatización comercial." },
        { title: "Operación privada", text: "Paneles, permisos, cola de acciones y auditoría de decisiones." },
        { title: "Módulos protegidos", text: "Separación de áreas sensibles como Chido, seguridad, memoria y código." },
      ]}
    />
  );
}
