import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandsQueue from "@/components/CommandsQueue";
import SystemStatus from "@/components/SystemStatus";
import AgisRegistry from "@/components/AgisRegistry";
import NodeBadge from "@/components/NodeBadge";
import WorkspaceBar from "@/components/WorkspaceBar";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Centro de mando visual y operativo del ecosistema HOCKER ONE.",
};

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Vista operativa en tiempo real del núcleo, la cola de comandos y el estado del ecosistema."
      actions={
        <div className="flex items-center gap-3">
          <NodeBadge />
          <Link
            href="/governance"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-300 transition-all hover:bg-rose-500/20 active:scale-95"
          >
            Seguridad
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6 sm:gap-8">
        <Hint title="Centro de mando">
          Esta vista concentra ejecución, salud y registro de inteligencias activas. Todo lo visible aquí viene del runtime real, no de una maqueta.
        </Hint>

        <section className="hocker-panel-pro overflow-hidden border-sky-500/20">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-sky-400/30 blur-md animate-pulse" />
                  <Image
                    src="/brand/hocker-one-isotype.png"
                    alt="Hocker One"
                    width={56}
                    height={56}
                    priority
                    className="relative drop-shadow-[0_0_18px_rgba(14,165,233,0.35)]"
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
                    Hocker ONE
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-4xl">
                    Núcleo activo
                  </h2>
                </div>
              </div>

              <p className="max-w-2xl text-[11px] leading-relaxed text-slate-400 sm:text-sm">
                Estado, ejecución y observabilidad en un solo plano. Navegación rápida, feedback real y superficies adaptadas a móvil y escritorio.
              </p>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-sky-400 transition-all hover:bg-sky-500/20 active:scale-95"
                >
                  Terminal NOVA
                </Link>
                <Link
                  href="/nodes"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-all hover:border-sky-500/30 hover:bg-white/10 active:scale-95"
                >
                  Nodos
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Nodo visible
                </p>
                <div className="mt-3">
                  <NodeBadge />
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Guías
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  El switch de tutorial se conserva aquí para onboarding y soporte.
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Control
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  Acceso rápido a la capa de gobernanza y emergencia.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          <section className="xl:col-span-8">
            <CommandsQueue />
          </section>

          <aside className="flex flex-col gap-6 xl:col-span-4">
            <SystemStatus />

            <div className="hocker-panel-pro min-h-[300px] flex-1 overflow-hidden">
              <AgisRegistry title="Células Operativas" />
            </div>

            <div className="hocker-panel-pro p-5">
              <WorkspaceBar />
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}