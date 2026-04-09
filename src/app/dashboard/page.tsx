import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PageShell from "@/components/PageShell";
import SystemStatus from "@/components/SystemStatus";
import EventsFeed from "@/components/EventsFeed";
import NodesPanel from "@/components/NodesPanel";
import AgisRegistry from "@/components/AgisRegistry";

export const metadata: Metadata = {
  title: "Vista general",
  description: "Resumen visual del ecosistema.",
};

export default function DashboardPage() {
  return (
    <PageShell
      title="Vista general"
      subtitle="Todo lo importante en una sola lectura."
      actions={
        <Link href="/chat" className="hocker-button-brand">
          Hablar
        </Link>
      }
    >
      <div className="mb-6 flex items-center justify-between gap-4 rounded-[28px] border border-white/5 bg-slate-950/40 p-4 sm:p-5">
        <BrandMark compact />
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Todo listo
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <div className="space-y-6">
            <div className="hocker-panel-pro p-5">
              <SystemStatus />
            </div>

            <div className="hocker-panel-pro p-5">
              <AgisRegistry title="Equipo activo" />
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