export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import AgisRegistry from "@/components/AgisRegistry";

export const metadata: Metadata = {
  title: "AGIs",
  description: "Jerarquía y delegación de funciones tácticas de la Mente Colmena.",
};

export default function AgisPage() {
  return (
    <PageShell
      title="Células de Inteligencia"
      subtitle="Jerarquía y delegación de funciones tácticas de la Mente Colmena."
      actions={
        <Link
          href="/chat"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Contactar a NOVA
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Arquitectura Estricta">
          Aquí se agrupan las inteligencias por su perímetro de acción. Cada agente tiene un rol definido, sin superposiciones innecesarias.
        </Hint>

        <AgisRegistry />
      </div>
    </PageShell>
  );
}
