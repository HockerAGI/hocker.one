import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export default function NotFound() {
  return (
    <HockerPublicPage
      eyebrow="404 · Ruta no encontrada"
      title="Esta página no existe o cambió de ubicación."
      description="La navegación pública de HOCKER sigue disponible. Vuelve al inicio, explora el ecosistema o abre un canal de contacto para encontrar el recurso correcto."
      primaryHref="/"
      primaryLabel="Volver al inicio"
      secondaryHref="/contacto"
      secondaryLabel="Contactar"
      cards={[
        {
          title: "Ecosistema",
          text: "Conoce cómo se conectan NOVA, AGIs, aplicaciones, memoria y control humano.",
        },
        {
          title: "Hocker ONE",
          text: "Explora la capa operativa que coordina decisiones, aprobaciones y evidencia.",
        },
        {
          title: "Servicios",
          text: "Revisa capacidades de marketing, automatización, software, IA e infraestructura.",
        },
      ]}
    />
  );
}
