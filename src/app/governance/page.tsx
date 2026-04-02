import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import GovernancePanel from "@/components/GovernancePanel";
import BiometricEnroller from "@/components/BiometricEnroller";

export const metadata: Metadata = {
  title: "Gobernanza",
  description: "Gestión de políticas de seguridad, identidad biométrica y protocolos de emergencia.",
};

export default function GovernancePage() {
  return (
    <PageShell
      title="Núcleo de Seguridad"
      subtitle="Gestión de identidades, estados de emergencia y protocolos de autoridad."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 sm:px-5 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-950 shadow-lg transition-all hover:bg-slate-200 active:scale-95"
        >
          <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </Link>
      }
    >
      <div className="flex flex-col gap-6 sm:gap-8">
        <Hint title="Políticas de grado militar">
          Las modificaciones en este sector alteran el comportamiento central de la Mente Colmena y las llaves de acceso al Búnker. Proceda con rigor.
        </Hint>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          <div className="xl:col-span-7 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="flex flex-col gap-4">
              <h3 className="px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Protocolos de contención
              </h3>
              <GovernancePanel />
            </div>
          </div>

          <div className="xl:col-span-5 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex flex-col gap-4">
              <h3 className="px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Identidad táctica
              </h3>

              <BiometricEnroller />

              <div className="mt-4 rounded-[24px] border border-sky-500/10 bg-sky-500/5 px-5 sm:px-6 py-5 shadow-inner">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-[11px] leading-relaxed text-sky-200/70 font-medium">
                    <strong className="mb-1 block font-bold uppercase tracking-widest text-sky-400">
                      Nota operativa
                    </strong>
                    Al vincular este dispositivo, el protocolo Omni-Sync permitirá el acceso nativo mediante el hardware criptográfico de su terminal (huella / Face ID).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}