import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NovaChat from "@/components/NovaChat";

export const metadata: Metadata = {
  title: "Terminal NOVA",
  description: "Canal cifrado de comunicación con la Conciencia Digital.",
};

export default function ChatPage() {
  return (
    <PageShell
      title="Terminal NOVA"
      subtitle="Canal cifrado para dialogar y orquestar el sistema en tiempo real."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-sky-400 hover:bg-sky-500/20 transition active:scale-95"
        >
          Búnker
        </Link>
      }
    >
      <div className="flex flex-col gap-4 sm:gap-6">

        {/* INFO */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Hint title="Enlace de Alta Velocidad">
            Conexión directa con el núcleo NOVA. Las decisiones aquí tienen prioridad absoluta.
          </Hint>
        </div>

        {/* TERMINAL */}
        <div className="hocker-panel-pro flex flex-1 flex-col overflow-hidden border-sky-500/30 shadow-[0_0_50px_rgba(14,165,233,0.15)] animate-in fade-in zoom-in-95 duration-700">

          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-950/50 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
                <span className="relative h-3 w-3 rounded-full bg-sky-500" />
              </span>

              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">
                NOVA ONLINE
              </span>
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              AES-256
            </span>
          </div>

          {/* CHAT */}
          <div className="flex-1 overflow-hidden bg-slate-950/20 p-2 sm:p-3">
            <NovaChat />
          </div>
        </div>
      </div>
    </PageShell>
  );
}