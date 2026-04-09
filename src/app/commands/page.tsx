import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Tareas",
  description: "Centro de instrucciones y seguimiento.",
};

export default function CommandsPage() {
  return (
    <PageShell
      title="Tareas"
      subtitle="Escribe una instrucción clara y sigue su avance."
    >
      <div className="flex flex-col gap-6">
        <Hint title="Antes de enviar">
          Mantén la instrucción corta. Una idea por tarea.
        </Hint>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          <div className="xl:col-span-5">
            <CommandBox />
          </div>

          <div className="xl:col-span-7">
            <CommandsQueue />
          </div>
        </div>
      </div>
    </PageShell>
  );
}