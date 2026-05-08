import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { Bot, Brush, FileText, Film, Globe2, Megaphone, Receipt, ShoppingBag, Workflow } from "lucide-react";

export const metadata: Metadata = {
  title: "Servicios · Hocker ONE",
  description: "Servicios comerciales del ecosistema Hocker.",
};

const services = [
  { title: "Publicidad IA", text: "Campañas y anuncios medibles.", icon: Megaphone },
  { title: "Branding", text: "Marca, identidad y piezas visuales.", icon: Brush },
  { title: "Landing pages", text: "Páginas claras para captar clientes.", icon: Globe2 },
  { title: "Automatización", text: "Flujos, respuestas y tareas repetitivas.", icon: Workflow },
  { title: "Video y reels", text: "Contenido corto para redes.", icon: Film },
  { title: "CRM", text: "Clientes, ventas y seguimiento.", icon: Bot },
  { title: "Tienda online", text: "Productos, pedidos y pagos.", icon: ShoppingBag },
  { title: "Facturación", text: "Control, reportes y orden fiscal.", icon: Receipt },
  { title: "Documentos", text: "Contratos, propuestas y reportes.", icon: FileText },
];

export default function ServiciosPage() {
  return (
    <PageShell
      eyebrow="Oferta"
      title="Servicios"
      subtitle="Catálogo simple para Hocker Ads, clientes y portales derivados. Cada servicio puede convertirse después en página propia."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <article key={service.title} className="hocker-panel-pro p-5">
              <Icon className="h-7 w-7 text-cyan-300" />
              <h2 className="mt-5 text-xl font-black text-white">{service.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{service.text}</p>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}
