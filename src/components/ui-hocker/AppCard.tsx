import Link from "next/link";
import type { AppRegistryItem } from "@/lib/hocker-dashboard";
import { getStatusHelp } from "@/lib/hocker-dashboard";
import ModuleLogoFrame from "@/components/ui-hocker/ModuleLogoFrame";
import StatusBadge from "@/components/ui-hocker/StatusBadge";

export default function AppCard({ app, featured = false }: { app: AppRegistryItem; featured?: boolean }) {
  return (
    <article id={app.key} className={["hko-module-card hko-fade-up", featured ? "lg:col-span-2" : ""].join(" ")}>
      <div className="flex items-start gap-4">
        <ModuleLogoFrame title={app.title} src={app.logoSrc} kind="app" accent={app.accent} size={featured ? "lg" : "md"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">{app.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{app.subtitle}</p>
            </div>
            <StatusBadge status={app.status} compact />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{app.note}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={app.href} className="hko-action-primary">
          Abrir
        </Link>
        <details className="group">
          <summary className="hko-action-secondary list-none">Detalles</summary>
          <div className="mt-3 rounded-2xl border border-white/8 bg-slate-950/55 p-4 text-sm leading-relaxed text-slate-300">
            <p><strong className="text-white">Conecta:</strong> {app.integration}</p>
            <p className="mt-2"><strong className="text-white">Estado:</strong> {getStatusHelp(app.status)}</p>
            <p className="mt-2 text-xs text-slate-500">Ruta interna: {app.href}</p>
          </div>
        </details>
      </div>
    </article>
  );
}
