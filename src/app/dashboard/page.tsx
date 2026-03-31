import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import EventsFeed from "@/components/EventsFeed";
import SystemStatus from "@/components/SystemStatus";
import Hint from "@/components/Hint";

export const metadata: Metadata = {
  title: "Visión Global | Hocker ONE",
};

export default function DashboardPage() {
  return (
    <PageShell title="Visión Global" subtitle="Monitoreo de telemetría y salud de la infraestructura.">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <EventsFeed />
        </div>
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <SystemStatus />
          <Hint title="Análisis de Red">
            El feed de telemetría captura cada evento de los nodos. Los errores de nivel 'Critical' dispararán automáticamente el protocolo de aislamiento.
          </Hint>
        </aside>
      </div>
    </PageShell>
  );
}
