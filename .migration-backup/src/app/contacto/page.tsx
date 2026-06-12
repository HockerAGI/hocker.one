import type { Metadata } from "next";
import Link from "next/link";
import HockerPublicPage from "@/components/public-marketing/HockerPublicPage";

export const metadata: Metadata = {
  title: "Contacto · HOCKER",
  description: "Contacto oficial para HOCKER AGI Technologies y Hocker ONE.",
};

export default function ContactoPage() {
  return (
    <div>
      <HockerPublicPage
        eyebrow="Contacto"
        title="Construyamos el siguiente sistema inteligente."
        description="Canal público para iniciar diagnóstico, alianza, proyecto o acceso privado al ecosistema HOCKER."
        primaryHref="mailto:contacto.hocker@gmail.com"
        primaryLabel="Enviar correo"
        secondaryHref="/one"
        secondaryLabel="Ver Hocker ONE"
        cards={[
          { title: "Correo", text: "contacto.hocker@gmail.com" },
          { title: "Portafolio", text: "linkfly.to/hocker" },
          { title: "Acceso privado", text: "Disponible sólo con credenciales autorizadas." },
        ]}
      />
      <div className="sr-only">
        <Link href="mailto:contacto.hocker@gmail.com">contacto.hocker@gmail.com</Link>
      </div>
    </div>
  );
}
