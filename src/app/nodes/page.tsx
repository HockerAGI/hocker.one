import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NodesPanel from "@/components/NodesPanel";

export const metadata: Metadata = {
  title: "Nodos",
  description: "Supervisión técnica de los activos de ejecución y puntos de control distribuidos.",
};

export default function NodesPage() {
  return (
    <PageShell
      title="Infraestructura de Nodos"
      subtitle="Supervisión técnica de los activos de ejecución y puntos de control distribuidos."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Panel
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Soberanía de Red">
          Cada nodo representa una unidad de ejecución del Automation Fabric. Desde aquí se audita el latido de servidores y agentes físicos.
        </Hint>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <NodesPanel />
        </div>
      </div>
    </PageShell>
  );
}