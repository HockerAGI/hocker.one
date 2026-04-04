import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandBoxClient from "@/components/CommandBoxClient";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Acciones",
  description: "Centro de órdenes y seguimiento.",
};

export default function CommandsPage() {
  return (
    <PageShell
      title="Acciones"
      subtitle="Crea, revisa y sigue órdenes sin ruido."
    >
      <div className="flex flex-col gap-6">
        <Hint title="Centro de comando">
          Aquí se generan y revisan órdenes.
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