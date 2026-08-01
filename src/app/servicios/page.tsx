import type { Metadata } from "next";
import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export const metadata: Metadata = {
  title: "Servicios | Hocker AGI Technologies",
  description:
    "Servicios de HOCKER AGI Technologies: marketing, automatización, desarrollo, IA y operación.",
};

export default function ServiciosPage() {
  return (
    <HockerPublicPage
      eyebrow="Servicios"
      title="Capacidad estratégica convertida en ejecución."
      description="Diseñamos y operamos sistemas que conectan marketing, automatización, software e inteligencia artificial con objetivos comerciales medibles."
      primaryHref="/contacto"
      primaryLabel="Solicitar propuesta"
      secondaryHref="/casos"
      secondaryLabel="Revisar capacidades"
      cards={[
        {
          title: "Marketing con IA",
          text: "Estrategia, anuncios, contenido, reputación y optimización conectados al funnel comercial.",
        },
        {
          title: "Automatización",
          text: "Procesos, CRM, seguimiento, aprobaciones y flujos que reducen tiempos y errores operativos.",
        },
        {
          title: "Producto y software",
          text: "Interfaces, paneles, aplicaciones y experiencias construidas para uso real y crecimiento sostenido.",
        },
        {
          title: "Inteligencias especializadas",
          text: "Diseño de agentes y perfiles orientados a funciones concretas, con límites, memoria y evidencia.",
        },
        {
          title: "Infraestructura",
          text: "Deploy, seguridad, dominios, cloud, observabilidad y continuidad técnica para producción.",
        },
        {
          title: "Consultoría ejecutiva",
          text: "Diagnóstico, arquitectura, roadmap y priorización para invertir donde el impacto es mayor.",
        },
      ]}
    />
  );
}
