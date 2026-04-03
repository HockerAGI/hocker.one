import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NovaChatClient from "@/components/NovaChatClient";

export const metadata: Metadata = {
  title: "Sala de Mando",
  description: "Centro de mando visual y operativo del ecosistema HOCKER ONE.",
};

export default function HomePage() {
  return (
    <PageShell
      title="Sala de Mando"
      subtitle="Vista principal del núcleo, la conversación NOVA y la operación en tiempo real."
      actions={
        <Link href="/dashboard" className="hocker-button-primary">
          <svg
            className="h-4 w-4 text-sky-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Dashboard
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <Hint title="Acceso activo">
            Desde aquí se supervisa la conversación con NOVA, el estado del sistema y las acciones críticas del ecosistema.
          </Hint>
        </div>

        <div className="lg:col-span-4">
          <div className="hocker-panel-pro flex flex-1 flex-col overflow-hidden border-sky-500/30 shadow-[0_0_40px_rgba(14,165,233,0.1)] animate-in fade-in zoom-in-95 duration-700">
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/50 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
                </span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-sky-400 drop-shadow-[0_0_5px_rgba(14,165,233,0.5)]">
                  Conexión segura establecida
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono uppercase text-slate-500">
                AES-256 E2E
              </span>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-950/20 p-2 sm:p-3">
              <NovaChatClient />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}