import type { DashboardSummary } from "@/lib/hocker-dashboard";
import AppCard from "@/components/ui-hocker/AppCard";
import AgiCard from "@/components/ui-hocker/AgiCard";
import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import HockerSection from "@/components/ui-hocker/HockerSection";
import StatusBadge from "@/components/ui-hocker/StatusBadge";
import LiveOperationsCenter from "@/components/dashboard/LiveOperationsCenter";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  }).format(new Date(value));
}

export default function DashboardClient({ summary }: { summary: DashboardSummary }) {
  const apps = summary.apps.slice(0, 6);
  const agis = summary.agis.filter((agi) => ["nova", "syntia", "vertx", "curvewind"].includes(agi.key));

  return (
    <div className="space-y-6">
      <HockerPageHeader
        eyebrow="Resumen operativo"
        title="Dashboard"
        text={`Estado generado ${formatDate(summary.snapshotAt)}. Las métricas separan configuración, señal y ejecución real.`}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.metrics.map((metric) => (
          <article key={metric.label} className="hko-mini-stat">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p className="mt-2 text-xs text-slate-400">{metric.hint}</p>
          </article>
        ))}
      </section>

      <HockerSection title="Aplicaciones" text="Existencia y señal operativa, no catálogo comercial." defaultOpen>
        <div className="grid gap-4 lg:grid-cols-3">{apps.map((app) => <AppCard key={app.key} app={app} />)}</div>
      </HockerSection>

      <HockerSection title="AGIs centrales" text="Registro y evidencia de ejecución de los perfiles principales." defaultOpen>
        <div className="grid gap-4 lg:grid-cols-4">{agis.map((agi) => <AgiCard key={agi.key} agi={agi} />)}</div>
      </HockerSection>

      <HockerSection title="Operación registrada" text="Eventos y comandos obtenidos de Supabase." defaultOpen={false}>
        <LiveOperationsCenter summary={summary} />
      </HockerSection>

      <HockerSection title="Repositorios configurados" text="La presencia en el catálogo no equivale a un estado en vivo verificado." defaultOpen={false}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summary.repos.map((repo) => (
            <article key={repo.key} className="hko-module-card">
              <StatusBadge status={repo.status} />
              <h3 className="mt-4 text-lg font-black text-white">{repo.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{repo.subtitle}</p>
              <p className="mt-3 text-xs text-slate-500">Rama declarada: {repo.branch}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{repo.note}</p>
            </article>
          ))}
        </div>
      </HockerSection>
    </div>
  );
}
