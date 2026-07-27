import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { GlassCard } from "@/components/system";

export const metadata: Metadata = {
  title: "Servicios | Hocker AGI Technologies",
  description:
    "Servicios de HOCKER AGI Technologies: marketing, automatización, desarrollo, IA y operación.",
};

const services = [
  { title: "Marketing IA", text: "Estrategia, anuncios, contenido y optimización comercial." },
  { title: "Automatización", text: "Procesos, flujos, CRM, approvals y seguimiento." },
  { title: "Software", text: "Interfaces, paneles, apps y experiencias de producto." },
  { title: "AGI", text: "Diseño de inteligencias especializadas y orquestación central." },
  { title: "Infraestructura", text: "Deploy, seguridad, dominios, cloud y operación técnica." },
  { title: "Consultoría", text: "Diagnóstico, roadmap y priorización de ejecución." },
];

export default function ServiciosPage() {
  return (
    <PageShell
      eyebrow="Servicios"
      title="Qué hacemos"
      description="Servicios diseñados para convertir contexto en ejecución: más claridad, más velocidad y más control."
      actions={
        <Link href="/contacto" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
          Solicitar propuesta
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <GlassCard key={service.title} title={service.title} description={service.text} interactive />
        ))}
      </div>
    </PageShell>
  );
}
