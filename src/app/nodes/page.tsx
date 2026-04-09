import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import NodesPanel from "@/components/NodesPanel";

export const metadata: Metadata = {
  title: "Equipo",
  description: "Supervisión de activos en vivo.",
};

export default function NodesPage() {
  return (
    <PageShell
      title="Equipo"
      subtitle="Todo lo que está conectado y activo."
      actions={
        <Link href="/dashboard" className="hocker-button-primary">
          Volver
        </Link>
      }
    >
      <div className="flex flex-col gap-6 sm:gap-8">
        <Hint title="Visibilidad">
          Mira quién está activo y cuándo fue su última señal.
        </Hint>

        <div className="hocker-panel-pro relative overflow-hidden border-sky-500/10 hocker-page-enter">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at center, #0ea5e9 2px, transparent 2px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10 p-4 sm:p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-3 border-b border-white/5 pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-white">
                Estado en tiempo real
              </h2>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Actualizando
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