import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { GlassCard } from "@/components/system";

export const metadata: Metadata = {
  title: "Soluciones | Hocker AGI Technologies",
  description:
    "Soluciones comerciales y operativas del ecosistema HOCKER AGI Technologies.",
};

const solutions = [
  { title: "Ecosistema IA", text: "NOVA + AGIs + apps + control para operar como un sistema único." },
  { title: "Ventas y leads", text: "Captación, seguimiento y cierre con automatización real." },
  { title: "Operación interna", text: "Menos ruido, más control y mejores tiempos de respuesta." },
  { title: "Marca y contenido", text: "Narrativa, visuales y comunicación con identidad propia." },
];

export default function SolucionesPage() {
  return (
    <PageShell
      eyebrow="Soluciones"
      title="Soluciones que venden"
      description="No se trata de páginas; se trata de resolver problemas de negocio con software, IA y operación."
      actions={
        <Link href="/contacto" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
          Hablar de mi caso
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {solutions.map((solution) => (
          <GlassCard key={solution.title} title={solution.title} description={solution.text} interactive />
        ))}
      </div>
    </PageShell>
  );
}
