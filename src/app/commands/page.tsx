import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandsQueue from "@/components/CommandsQueue";
import CommandBoxClient from "@/components/CommandBoxClient";

export const metadata: Metadata = {
  title: "Acciones",
  description: "Centro de inyección, aprobación y seguimiento de comandos.",
};

export default function CommandsPage() {
  return (
    <PageShell
      title="Acciones"
      subtitle="Inyección táctica, cola de ejecución y supervisión operativa."
    >
      <div className="flex flex-col gap-6">
        <Hint title="Centro de comando">
          Desde aquí se generan, encolan y supervisan las órdenes del ecosistema.
        </Hint>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          <div className="xl:col-span-5">
            <CommandBoxClient />
          </div>

          <div className="xl:col-span-7">
            <CommandsQueue />
          </div>
        </div>
      </div>
    </PageShell>
  );
}