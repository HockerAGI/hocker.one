import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NovaChat from "@/components/NovaChat";
import Link from "next/link";

export default function ChatPage() {
  return (
    <PageShell
      title="Terminal NOVA"
      subtitle="Canal cifrado para dialogar, auditar la matriz y orquestar el plan Omni-Sync."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98]"
        >
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Búnker
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Guía táctica con entrada suave */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Hint title="Enlace de Alta Velocidad">
            Esta terminal está conectada directamente a mi núcleo central. Las órdenes operativas y estratégicas que apruebes aquí tienen prioridad absoluta en el ecosistema.
          </Hint>
        </div>
        
        {/* El núcleo de comunicación expandido */}
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <NovaChat />
        </div>
      </div>
    </PageShell>
  );
}
