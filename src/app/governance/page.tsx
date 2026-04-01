import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import GovernancePanel from "@/components/GovernancePanel";

export const metadata: Metadata = {
  title: "Gobernanza",
  description: "Gestión de políticas de seguridad y protocolos de emergencia.",
};

export default function GovernancePage() {
  return (
    <PageShell
      title="Núcleo de Seguridad"
      subtitle="Gestión de identidades, estados de emergencia y protocolos de autoridad."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-950 shadow-lg transition-all hover:bg-slate-200 active:scale-95"
        >
          <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </Link>
      }
    >
      <div className="flex flex-col gap-8">
        <Hint title="Políticas de Grado Militar">
          Las modificaciones en este sector alteran el comportamiento central de la Mente Colmena y las llaves de acceso al Búnker. Proceda con rigor.
        </Hint>

        <div className="grid grid-cols-1 gap-8">
          {/* COLUMNA ÚNICA: GOBERNANZA CENTRAL (Kill Switches) */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-4">
              <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Protocolos de Contención
              </h3>
              <GovernancePanel />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
