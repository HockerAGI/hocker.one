import type { Metadata } from "next";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";
import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import HockerSection from "@/components/ui-hocker/HockerSection";

export const metadata: Metadata = {
  title: "Tareas | Hocker ONE",
  description: "Tareas y seguimiento operativo de Hocker ONE.",
};

export default function CommandsPage() {
  return (
    <div className="hko-page-flow space-y-4">
      <HockerPageHeader eyebrow="Operación" title="Tareas" text="Crea acciones cortas, revisa avances y deja lo técnico guardado en detalles." />
      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <CommandBox />
        <CommandsQueue />
      </section>
      <HockerSection title="Regla de operación" text="Las acciones sensibles siempre requieren aprobación." defaultOpen={false}>
        <p className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 text-sm leading-relaxed text-slate-300">Las acciones sensibles deben quedar protegidas por aprobación, owner gate o ejecución bloqueada cuando corresponda.</p>
      </HockerSection>
    </div>
  );
}
