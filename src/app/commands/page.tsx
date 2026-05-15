import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Tareas · Hocker ONE",
  description: "Tareas, aprobaciones y seguimiento del ecosistema.",
};

function InfoCard({ title, text }: { title: string; text: string }) {
  return <div className="hocker-panel-pro p-4"><h2 className="text-base font-black text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>;
}

export default function CommandsPage() {
  return (
    <PageShell
      eyebrow="Operación"
      title="Tareas"
      description="Crea instrucciones, revisa pendientes y confirma qué quedó listo. Los datos técnicos quedan en detalles."
      actions={<div className="flex flex-wrap gap-2"><Link href="/dashboard" className="hocker-button-ghost">Resumen</Link><Link href="/governance" className="hocker-button-primary">Gobernanza</Link></div>}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard title="Escribe claro" text="Una tarea corta ayuda a revisar, aprobar y cerrar sin confusión." />
          <InfoCard title="Revisa antes" text="Los cambios sensibles pasan por control antes de avanzar." />
          <InfoCard title="Cierra con estado" text="Una tarea termina cuando aparece como lista o con error claro." />
        </section>
        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><div className="hocker-panel-pro p-5"><h2 className="text-xl font-black text-white">Nueva tarea</h2><p className="mt-2 text-sm leading-6 text-slate-400">Describe lo que necesitas hacer. Usa detalles solo si hacen falta.</p><div className="mt-5"><CommandBox /></div></div><div className="hocker-panel-pro p-5"><h2 className="text-xl font-black text-white">Seguimiento</h2><p className="mt-2 text-sm leading-6 text-slate-400">Pendientes, en curso, listas o con error.</p><div className="mt-5"><CommandsQueue /></div></div></section>
      </div>
    </PageShell>
  );
}
