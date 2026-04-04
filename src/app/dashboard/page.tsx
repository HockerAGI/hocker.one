import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
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
          className="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-sky-300 transition-all hover:bg-sky-500/20 active:scale-95"
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
    </PageShell>
  );
}