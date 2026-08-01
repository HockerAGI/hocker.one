import type { Metadata } from "next";
import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export const metadata: Metadata = {
  title: "Seguridad | Hocker AGI Technologies",
  description:
    "Principios públicos de seguridad, privacidad, control humano y trazabilidad del ecosistema HOCKER.",
};

export default function SeguridadPage() {
  return (
    <HockerPublicPage
      eyebrow="Seguridad"
      title="La capacidad crece sin renunciar al control."
      description="El ecosistema HOCKER separa información pública, operación privada y módulos sensibles. Las acciones de impacto se limitan por identidad, proyecto, permisos, aprobación y evidencia."
      primaryHref="/contacto"
      primaryLabel="Solicitar evaluación"
      secondaryHref="/one"
      secondaryLabel="Ver Hocker ONE"
      cards={[
        {
          title: "Menor privilegio",
          text: "Cada servicio recibe únicamente el acceso necesario para su función y alcance operativo.",
        },
        {
          title: "Control humano",
          text: "Las decisiones sensibles pueden requerir aprobación explícita antes de producir cambios reales.",
        },
        {
          title: "Aislamiento por proyecto",
          text: "Datos, nodos, tareas y acciones se separan por contexto para reducir exposición cruzada.",
        },
        {
          title: "Evidencia verificable",
          text: "Las ejecuciones importantes conservan estados, resultados, hashes y contexto para auditoría.",
        },
        {
          title: "Superficie pública mínima",
          text: "La comunicación indexable explica capacidades sin publicar secretos, runtime interno ni datos privados.",
        },
        {
          title: "Defensa por capas",
          text: "Autenticación, RLS, límites de entrada, sandbox, validaciones y monitoreo trabajan en conjunto.",
        },
      ]}
    />
  );
}
