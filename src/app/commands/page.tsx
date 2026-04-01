import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Acciones",
  description: "Centro de ejecución y trazabilidad de comandos.",
};

export default function CommandsPage() {
  return (
    <PageShell
      title="Centro de Comandos"
      subtitle="Ejecución, validación y monitoreo en tiempo real."
    >
      <div className="flex flex-col gap-6">

        {/* INFO */}
        <Hint title="Validación de Seguridad">
          Toda instrucción requiere firma HMAC. Los comandos críticos pasan por aprobación antes de ejecutarse.
        </Hint>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">

          {/* INYECCIÓN */}
          <div className="xl:col-span-5 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="hocker-panel-pro p-4 sm:p-6 border-sky-500/20 hover:border-sky-400/40 transition">
              <CommandBox />
            </div>
          </div>

          {/* EJECUCIÓN */}
          <div className="xl:col-span-7 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="hocker-panel-pro p-4 sm:p-6 border-white/10 hover:border-sky-500/30 transition">
              <div className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Cola de Ejecución
              </div>

              <CommandsQueue />
            </div>
          </div>

        </div>
      </div>
    </PageShell>
  );
}