import PageShell from "@/components/PageShell";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";

export default function CommandsPage() {
  return (
    <PageShell
      title="Acciones"
      subtitle="Aquí lanzas acciones del sistema y apruebas las que requieren confirmación."
    >
      <div className="grid grid-cols-1 gap-6">
        <div className="hocker-card p-5">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-lg font-bold">Nueva acción</div>
              <div className="hocker-muted">
                Tip: si sale “Modo lectura”, ve a <a className="font-semibold text-blue-700 hover:underline" href="/governance">Seguridad</a> y activa “Modo de escritura”.
              </div>
            </div>
          </div>
          <div className="mt-4">
            <CommandBox />
          </div>
        </div>

        <CommandsQueue />
      </div>
    </PageShell>
  );
}
