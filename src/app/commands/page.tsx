import type { Metadata } from "next";
import Link from "next/link";
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
      <HockerPageHeader eyebrow="Operación" title="Tareas" text="Pide una tarea clara. NOVA la organiza y la manda a revisión cuando esté lista." />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-300/10 bg-sky-300/[0.035] px-4 py-3">
        <p className="max-w-2xl text-sm text-slate-300">
          Las tareas se preparan aquí. Las decisiones sensibles se revisan por separado con la sesión Owner y MFA.
        </p>
        <Link href="/owner/actions" className="hko-action-primary inline-flex min-h-11 items-center justify-center">
          Revisar aprobaciones
        </Link>
      </div>
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
