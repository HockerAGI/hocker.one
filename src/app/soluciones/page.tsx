import type { Metadata } from "next";
import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export const metadata: Metadata = {
  title: "Soluciones | Hocker AGI Technologies",
  description:
    "Soluciones comerciales y operativas del ecosistema HOCKER AGI Technologies.",
};

export default function SolucionesPage() {
  return (
    <HockerPublicPage
      eyebrow="Soluciones"
      title="Sistemas diseñados alrededor del resultado."
      description="No se trata de acumular páginas o herramientas. Se trata de integrar estrategia, software, inteligencia y operación para resolver cuellos de botella comerciales concretos."
      primaryHref="/contacto"
      primaryLabel="Hablar de mi caso"
      secondaryHref="/ecosistema"
      secondaryLabel="Ver arquitectura"
      cards={[
        {
          title: "Ecosistema inteligente",
          text: "NOVA, AGIs, aplicaciones y control humano coordinados como un sistema operativo único.",
        },
        {
          title: "Ventas y leads",
          text: "Captación, calificación, seguimiento y cierre conectados mediante automatización y contexto.",
        },
        {
          title: "Operación interna",
          text: "Menos ruido, tareas más claras, evidencia centralizada y mejores tiempos de respuesta.",
        },
        {
          title: "Marca y contenido",
          text: "Narrativa, identidad visual, piezas y campañas consistentes con la estrategia comercial.",
        },
        {
          title: "Control ejecutivo",
          text: "Dashboards, alertas, aprobaciones y trazabilidad para decidir sin perder profundidad operativa.",
        },
        {
          title: "Escalabilidad técnica",
          text: "Arquitectura modular, seguridad, observabilidad y despliegue continuo para crecer con control.",
        },
      ]}
    />
  );
}
