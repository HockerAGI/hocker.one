import type { DashboardSummary } from "@/lib/hocker-dashboard";
import AppCard from "@/components/ui-hocker/AppCard";
import AgiCard from "@/components/ui-hocker/AgiCard";
import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import HockerSection from "@/components/ui-hocker/HockerSection";
import NovaCorePanel from "@/components/ui-hocker/NovaCorePanel";
import StatusBadge from "@/components/ui-hocker/StatusBadge";
import LiveOperationsCenter from "@/components/dashboard/LiveOperationsCenter";

export default function DashboardClient({ summary }: { summary: DashboardSummary }) {
  const apps = summary.apps.slice(0, 6);
  const agis = summary.agis.filter((agi) => ["nova", "syntia", "vertx", "curvewind"].includes(agi.key));

  return (
    <div className="space-y-6">
      <HockerPageHeader eyebrow="Resumen" title="Dashboard" text="Vista ejecutiva para entender rápido qué está activo, qué está protegido y qué requiere revisión." />
      <NovaCorePanel />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.metrics.map((metric) => (
          <article key={metric.label} className="hko-mini-stat">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p className="mt-2 text-xs text-slate-400">{metric.hint}</p>
          </article>
        ))}
      </section>
      <HockerSection title="Apps" text="Plataformas principales del ecosistema." defaultOpen>
        <div className="grid gap-4 lg:grid-cols-3">{apps.map((app) => <AppCard key={app.key} app={app} />)}</div>
      </HockerSection>
      <HockerSection title="AGIs centrales" text="NOVA y el tridente estratégico." defaultOpen>
        <div className="grid gap-4 lg:grid-cols-4">{agis.map((agi) => <AgiCard key={agi.key} agi={agi} />)}</div>
      </HockerSection>
      <HockerSection title="Operación en vivo" text="Eventos recientes y tareas reales, con detalles técnicos ocultos." defaultOpen={false}>
        <LiveOperationsCenter summary={summary} />
      </HockerSection>
      <HockerSection title="Repositorios" text="Estado de los repos principales." defaultOpen={false}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summary.repos.map((repo) => (
            <article key={repo.key} className="hko-module-card">
              <StatusBadge status={repo.status} />
              <h3 className="mt-4 text-lg font-black text-white">{repo.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{repo.subtitle}</p>
              <p className="mt-3 text-xs text-slate-500">Rama: {repo.branch}</p>
            </article>
          ))}
        </div>
      </HockerSection>
    </div>
  );
}
