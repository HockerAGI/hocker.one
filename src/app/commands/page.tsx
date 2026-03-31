import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Acciones",
  description: "Centro de inyección, aprobación y seguimiento de comandos.",
};

export default function CommandsPage() {
  return (
    <PageShell title="Acciones" subtitle="Gestión de órdenes operativas con trazabilidad completa.">
      <div className="flex flex-col gap-6">
        <Hint title="Validación de Seguridad">
          Toda instrucción emitida desde esta terminal requiere firma HMAC y validación de nodo. Los comandos críticos pasarán por la cola de aprobación.
        </Hint>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          {/* INYECTOR (HUD) */}
          <div className="xl:col-span-5">
            <CommandBox />
          </div>

          {/* HISTORIAL (TERMINAL) */}
          <div className="xl:col-span-7">
            <CommandsQueue />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
