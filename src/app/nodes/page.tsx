import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NodesPanel from "@/components/NodesPanel";

export const metadata: Metadata = {
  title: "Nodos",
  description: "Supervisión de activos de ejecución.",
};

export default function NodesPage() {
  return (
    <PageShell
      title="Red de Nodos"
      subtitle="Activos en vivo, latido y estado."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-sky-400 transition-all hover:bg-sky-500/20 active:scale-95"
        >
          Volver
        </Link>
      }
    >
      <div className="flex flex-col gap-6 sm:gap-8">
        <div className="hocker-fade-up">
          <Hint title="Soberanía de red">
            Cada nodo representa una unidad de ejecución.
          </Hint>
        </div>

        <div className="hocker-panel-pro relative overflow-hidden border-sky-500/10 hocker-page-enter">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, #0ea5e9 2px, transparent 2px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 p-4 sm:p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-3 border-b border-white/5 pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-3 text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-white">
                Radar de activos
              </h2>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Escaneo activo
                </span>
              </div>
            </div>

            <NodesPanel />
          </div>
        </div>
      </div>
    </PageShell>
  );
}