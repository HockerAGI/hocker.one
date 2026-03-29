import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandsQueue from "@/components/CommandsQueue";
import Link from "next/link";

export default function CommandsPage() {
  return (
    <PageShell
      title="Protocolos de Ejecución"
      subtitle="Supervisión activa de la cola operativa y validación de órdenes en curso."
      actions={
        <Link
          href="/governance"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98]"
        >
          <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Escudo de Gobernanza
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Aviso de flujo operativo con entrada cinemática */}
        <div className=\"animate-in fade-in slide-in-from-bottom-2 duration-300\">
          <Hint title="Flujo de Trabajo Blindado">
            Desde este sector, monitoreas el estado real de cada instrucción enviada a los nodos. 
            Recuerda que si el Kill Switch está activo en el Escudo de Gobernanza, ninguna orden pasará de la fase de cola.
          </Hint>
        </div>
        
        {/* La Cola de Comandos expandida con mayor visibilidad */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <CommandsQueue />
        </div>
      </div>
    </PageShell>
  );
}
