import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import SystemStatus from "@/components/SystemStatus";
import EventsFeed from "@/components/EventsFeed";
import NodesPanel from "@/components/NodesPanel";
import AgisRegistry from "@/components/AgisRegistry";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Resumen visual del ecosistema.",
};

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Resumen claro de salud, nodos y actividad."
      actions={
        <Link
          href="/chat"
          className="hocker-button-brand"
        >
          NOVA
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <div className="space-y-6">
            <div className="hocker-panel-pro p-5">
              <SystemStatus />
            </div>

            <div className="hocker-panel-pro p-5">
              <AgisRegistry title="Células activas" />
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 space-y-6">
          <div className="hocker-panel-pro p-5">
            <EventsFeed />
          </div>

          <div className="hocker-panel-pro p-5">
            <NodesPanel />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Hint title="Panel unificado">
          Este dashboard ya funciona como capa visual central: salud, eventos, nodos y células con el mismo lenguaje.
        </Hint>
      </div>
    </PageShell>
  );
}