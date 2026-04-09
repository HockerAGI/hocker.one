import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import GovernancePanel from "@/components/GovernancePanel";

export const metadata: Metadata = {
  title: "Seguridad",
  description: "Control de escritura y emergencia.",
};

const controlHighlights = [
  "Kill switch",
  "Lectura / escritura",
  "Aprobaciones",
  "Auditoría",
];

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
        <Hint title="Control total" tone="rose">
          Aquí se maneja el estado crítico del sistema. La interfaz está diseñada para leer rápido, actuar rápido y evitar errores.
        </Hint>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {controlHighlights.map((item) => (
            <div
              key={item}
              className="rounded-[24px] border border-white/5 bg-white/[0.03] p-4"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300">
                Control
              </p>
              <p className="mt-2 text-sm font-medium text-slate-300">
                {item}
              </p>
            </div>
          ))}
        </div>

        <div className="hocker-panel-pro overflow-hidden border-rose-500/15 shadow-[0_24px_120px_rgba(251,113,133,0.08)]">
          <div className="border-b border-white/5 bg-slate-950/45 px-5 py-4 sm:px-6">
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