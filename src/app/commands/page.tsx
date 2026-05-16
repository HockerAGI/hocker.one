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
    <div className="space-y-6">
      <HockerPageHeader eyebrow="Operación" title="Tareas" text="Aquí creas y revisas acciones del sistema en lenguaje claro. Los detalles técnicos quedan guardados, pero no saturan la vista." />
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <CommandBox />
        <CommandsQueue />
      </section>
      <HockerSection title="Regla de operación" text="Una tarea debe ser corta, clara y fácil de revisar." defaultOpen={false}>
        <p className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 text-sm leading-relaxed text-slate-300">Las acciones sensibles deben quedar protegidas por aprobación, owner gate o ejecución bloqueada cuando corresponda.</p>
      </HockerSection>
    </div>
  );
}
