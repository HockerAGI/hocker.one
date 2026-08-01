import type { Metadata } from "next";
import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export const metadata: Metadata = {
  title: "Ecosistema | Hocker AGI Technologies",
  description:
    "Arquitectura pública del ecosistema HOCKER: NOVA, AGIs, Hocker ONE, aplicaciones, memoria y control humano.",
};

export default function EcosistemaPage() {
  return (
    <HockerPublicPage
      eyebrow="Ecosistema HOCKER"
      title="Una arquitectura coordinada, no una colección de herramientas."
      description="NOVA, AGIs, aplicaciones, memoria y operación se conectan mediante Hocker ONE para convertir contexto en decisiones, evidencia y ejecución bajo control humano."
      primaryHref="/one"
      primaryLabel="Conocer Hocker ONE"
      secondaryHref="/contacto"
      secondaryLabel="Explorar una alianza"
      cards={[
        {
          title: "NOVA",
          text: "Interfaz central para comprender intención, coordinar especialistas y mantener continuidad contextual.",
        },
        {
          title: "AGIs especializadas",
          text: "Perfiles orientados a funciones concretas de marketing, tecnología, operación, análisis y cumplimiento.",
        },
        {
          title: "Hocker ONE",
          text: "Capa privada de navegación, supervisión, aprobaciones, evidencia y conexión entre sistemas.",
        },
        {
          title: "Apps y servicios",
          text: "Productos y módulos conectados a una misma identidad visual, operativa y tecnológica.",
        },
        {
          title: "Owner Gate",
          text: "Las acciones sensibles permanecen bajo autorización humana, alcance limitado y trazabilidad.",
        },
        {
          title: "Memoria y evidencia",
          text: "El aprendizaje útil se conserva con contexto, revisión y señales verificables para futuras decisiones.",
        },
      ]}
    />
  );
}
