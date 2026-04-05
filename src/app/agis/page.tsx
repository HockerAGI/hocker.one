import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import AgisRegistry from "@/components/AgisRegistry";

export const metadata: Metadata = {
  title: "AGIs",
  description: "Registro operativo de inteligencias del ecosistema.",
};

export default function AgisPage() {
  return (
    <PageShell
      title="AGIs"
      subtitle="Registro real de inteligencias activas y módulos operativos."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-all hover:bg-white/10 active:scale-95"
        >
          Dashboard
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Registro real">
          Este listado sale desde Supabase, no desde simulación local.
        </Hint>

        <section className="hocker-panel-pro p-4 sm:p-6 hocker-page-enter">
          <AgisRegistry title="Células operativas" />
        </section>
      </div>
    </PageShell>
  );
}