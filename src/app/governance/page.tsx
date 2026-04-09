import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import GovernancePanel from "@/components/GovernancePanel";

export const metadata: Metadata = {
  title: "Guardia",
  description: "Control de escritura y emergencia.",
};

export default function GovernancePage() {
  return (
    <PageShell
      title="Guardia"
      subtitle="Control simple y total."
      actions={
        <Link href="/dashboard" className="hocker-button-primary">
          Panel
        </Link>
      }
    >
      <div className="flex flex-col gap-6 sm:gap-8">
        <Hint title="Control total" tone="rose">
          Aquí se maneja el estado crítico del sistema.
        </Hint>

        <div className="hocker-panel-pro overflow-hidden border-rose-500/15 hocker-page-enter">
          <div className="border-b border-white/5 bg-slate-950/40 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300">
              Control principal
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