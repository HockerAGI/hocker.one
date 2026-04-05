import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import GovernancePanel from "@/components/GovernancePanel";

export const metadata: Metadata = {
  title: "Seguridad",
  description: "Control de escritura y emergencia.",
};

export default function GovernancePage() {
  return (
    <PageShell
      title="Seguridad"
      subtitle="Control simple, claro y total."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-300 transition-all hover:bg-rose-500/20 active:scale-95"
        >
          Dashboard
        </Link>
      }
    >
      <div className="flex flex-col gap-6 sm:gap-8">
        <Hint title="Control total">
          Aquí se maneja el estado crítico del sistema.
        </Hint>

        <div className="hocker-panel-pro overflow-hidden border-rose-500/15 hocker-page-enter">
          <div className="border-b border-white/5 bg-slate-950/40 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300">
              Matriz de control
            </p>
          </div>

          <div className="p-4 sm:p-6">
            <GovernancePanel />
          </div>
        </div>
      </div>
    </PageShell>
  );
}