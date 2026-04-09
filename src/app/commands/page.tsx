import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Acciones",
  description: "Centro de inyección, aprobación y seguimiento de comandos.",
};

const commandExamples = [
  "supply.create_order",
  "nodes.sync_status",
  "governance.lock_writes",
  "events.manual_log",
];

export default function CommandsPage() {
  return (
    <PageShell
      title="Acciones"
      subtitle="Órdenes operativas con trazabilidad completa."
    >
      <div className="flex flex-col gap-6">
        <Hint title="Validación de seguridad" tone="violet">
          Toda instrucción pasa por firma HMAC, control de permisos y estado de escritura. Lo crítico se enruta con aprobación.
        </Hint>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {commandExamples.map((item) => (
            <div
              key={item}
              className="rounded-[24px] border border-white/5 bg-white/[0.03] p-4"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
                Ejemplo
              </p>
              <p className="mt-2 text-sm font-medium text-slate-300">
                {item}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          <div className="xl:col-span-5">
            <CommandBox />
          </div>

          <div className="xl:col-span-7">
            <div className="hocker-panel-pro overflow-hidden p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
                    Cola activa
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white font-display">
                    Seguimiento de comandos
                  </h2>
                </div>
                <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-sky-300">
                  En vivo
                </span>
              </div>

              <CommandsQueue />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}