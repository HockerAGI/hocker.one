import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import AgisRegistry from "@/components/AgisRegistry";
import Link from "next/link";

export default function AgisPage() {
  return (
    <PageShell
      title="Células de Inteligencia"
      subtitle="Jerarquía y delegación de funciones tácticas de la Mente Colmena."
      actions={
        <Link
          href="/chat"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98]"
        >
          <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Contactar a NOVA
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Hint title="Arquitectura Estricta">
            Esta pantalla agrupa las inteligencias por su perímetro de acción. Cada agente tiene su rol blindado: Vertx audita, Syntia recuerda, Nexpa analiza riesgos y Jurix vigila el marco legal. Sin superposiciones, control absoluto.
          </Hint>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <AgisRegistry />
        </div>
      </div>
    </PageShell>
  );
}
