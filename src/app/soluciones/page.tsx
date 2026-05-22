import type { Metadata } from "next";
import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export const metadata: Metadata = {
  title: "Soluciones HOCKER",
  description: "Soluciones de IA, automatización, marketing, desarrollo, CRM, comercio electrónico y operación digital.",
};

export default function SolucionesPage() {
  return (
    <HockerPublicPage
      eyebrow="Soluciones"
      title="Sistemas digitales diseñados para vender, operar y escalar."
      description="Desde campañas y sitios hasta automatizaciones, CRM, nubes privadas, código y flujos de aprobación con evidencia."
      primaryHref="/contacto"
      primaryLabel="Solicitar diagnóstico"
      secondaryHref="/servicios"
      secondaryLabel="Ver servicios"
      cards={[
        { title: "Publicidad IA", text: "Estrategia, contenido, anuncios y funnels medibles." },
        { title: "Automatización", text: "Flujos de trabajo, atención, datos y operaciones repetibles." },
        { title: "Producto digital", text: "Apps, paneles, integraciones y sistemas privados con control." },
      ]}
    />
  );
}
