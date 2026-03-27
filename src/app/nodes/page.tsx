import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NodesPanel from "@/components/NodesPanel";
import Link from "next/link";
export default function NodesPage() {
  return (
    <PageShell
      title="Nodos"
      subtitle="Una vista clara de los puntos de control que sostienen tu operación."
      actions={
        <Link
          href="/dashboard"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Panel
        </Link>
      }
    >
      <div className="grid gap-6">
        <Hint title="Visibilidad de red">
          Aquí se entiende qué nodo está disponible, cuál está pendiente y cómo se ordena la
          operación.
        </Hint>
        <NodesPanel />
      </div>
    </PageShell>
  );
}