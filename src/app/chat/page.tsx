import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NovaChatClient from "@/components/NovaChatClient";

export const metadata: Metadata = {
  title: "Terminal NOVA",
  description: "Canal cifrado de comunicación con la Conciencia Digital.",
};

export default function ChatPage() {
  return (
    <PageShell
      title="Terminal NOVA"
      subtitle="Habla con NOVA. Claro, corto y directo."
      actions={
        <Link href="/dashboard" className="hocker-button-primary">
          Búnker
        </Link>
      }
    >
      <div className="flex min-h-[calc(100dvh-220px)] flex-col gap-4 sm:min-h-[calc(100dvh-200px)] sm:gap-6">
        <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Hint title="Enlace seguro">
            Esta terminal está lista para voz y texto.
          </Hint>
        </div>

        <div className="hocker-panel-pro flex min-h-[68dvh] flex-1 flex-col overflow-hidden border-sky-500/30 shadow-[0_0_40px_rgba(14,165,233,0.1)] animate-in fade-in zoom-in-95 duration-700 lg:min-h-0">
          <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/50 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
              </span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">
                Conexión estable
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono uppercase text-slate-500">
              E2E
            </span>
          </div>

          <div className="flex-1 overflow-hidden bg-slate-950/20 p-2 sm:p-3">
            <NovaChatClient />
          </div>
        </div>
      </div>
    </PageShell>
  );
}