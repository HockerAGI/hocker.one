import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import GovernancePanel from "@/components/GovernancePanel";
import Link from "next/link";
export default function GovernancePage() {
  return (
    <PageShell
      title="Gobernanza"
      subtitle="La capa que mantiene el orden, los permisos y la trazabilidad."
      actions={
        <Link
          href="/commands"
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Acciones
        </Link>
      }
    >
      <div className="grid gap-6">
        <Hint title="Control serio">
          Esta sección gobierna el comportamiento del ecosistema. Si algo no debe correr, aquí
          se detiene. Si algo sí debe correr, aquí se autoriza.
        </Hint>
        <GovernancePanel />
      </div>
    </PageShell>
  );
}