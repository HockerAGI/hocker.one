import type { Metadata } from "next";
import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export const metadata: Metadata = {
  title: "Casos · HOCKER",
  description: "Casos y avances públicos del ecosistema HOCKER, preparados sin exponer operación privada.",
};

export default function CasosPage() {
  return (
    <HockerPublicPage
      eyebrow="Casos"
      title="Casos preparados para mostrar resultados sin exponer operación privada."
      description="Esta sección queda lista para publicar avances, lanzamientos, casos de clientes y evidencia comercial indexable."
      primaryHref="/contacto"
      primaryLabel="Hablar del proyecto"
      secondaryHref="/ecosistema"
      secondaryLabel="Ver ecosistema"
      cards={[
        { title: "Hocker ONE", text: "Control plane privado con NOVA, Owner Gate, memoria y acciones reales." },
        { title: "Hocker Ads", text: "Agencia impulsada por IA para branding, anuncios y automatización." },
        { title: "HKR Supply", text: "Base comercial para productos, pedidos y operación conectada." },
      ]}
    />
  );
}
