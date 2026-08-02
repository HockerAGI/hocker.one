import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, RefreshCw, ServerCog } from "lucide-react";

import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import { getHockerOperationalSnapshot, type OperationalStatus } from "@/lib/hocker-operational-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Aplicaciones | Hocker ONE",
  description: "Inventario operativo y verificable de aplicaciones y servicios del ecosistema.",
  robots: { index: false, follow: false, noarchive: true },
};

function statusLabel(status: OperationalStatus): string {
  switch (status) {
    case "online": return "Verificada";
    case "degraded": return "Degradada";
    case "configured": return "Configurada";
    case "stale": return "Sin señal reciente";
    case "offline": return "Sin conexión";
    case "protected": return "Protegida";
    case "not_created": return "No existe aún";
    case "planned": return "Planificada";
    default: return "Sin verificar";
  }
}

function statusTone(status: OperationalStatus): string {
  switch (status) {
    case "online": return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
    case "degraded":
    case "offline": return "border-rose-300/25 bg-rose-300/10 text-rose-100";
    case "configured": return "border-cyan-300/25 bg-cyan-300/10 text-cyan-100";
    case "stale": return "border-amber-300/25 bg-amber-300/10 text-amber-100";
    case "protected": return "border-sky-300/25 bg-sky-300/10 text-sky-100";
    default: return "border-white/10 bg-white/[0.04] text-slate-300";
  }
}

function formatDate(value: string | null): string {
  if (!value) return "Sin actividad verificada";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  }).format(new Date(value));
}

export default async function AppsPage() {
  const snapshot = await getHockerOperationalSnapshot();

  return (
    <div className="hko-page-flow space-y-5">
      <HockerPageHeader
        eyebrow="Inventario operativo"
        title="Aplicaciones y servicios"
        text="Esta vista muestra existencia, señal y evidencia. Los conceptos documentados no se presentan como productos activos."
      />

      <section className="hko-map-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hko-kicker">Última lectura</p>
            <p className="mt-2 text-sm text-slate-300">{formatDate(snapshot.checked_at)}</p>
            <p className="mt-1 text-xs text-slate-500">Fuente: {snapshot.source === "supabase+health" ? "Supabase + health checks" : "Lectura parcial"}</p>
          </div>
          <Link href="/apps" className="hko-action-secondary inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.apps.map((app) => (
          <article key={app.key} className="hko-module-card hko-card-tight">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-100">
                <ServerCog className="h-5 w-5" />
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${statusTone(app.status)}`}>
                {statusLabel(app.status)}
              </span>
            </div>

            <h2 className="mt-4 text-xl font-black text-white">{app.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{app.summary}</p>

            <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/45 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Evidencia</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{app.evidence}</p>
              <p className="mt-3 text-xs text-slate-500">Última actividad: {formatDate(app.last_activity_at)}</p>
              {app.repository ? <p className="mt-1 text-xs text-slate-500">Repositorio: {app.repository}</p> : null}
            </div>

            {app.href ? (
              app.href.startsWith("http") ? (
                <a href={app.href} target="_blank" rel="noreferrer" className="hko-action-secondary mt-4 inline-flex items-center gap-2">
                  Abrir servicio <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <Link href={app.href} className="hko-action-primary mt-4">Abrir módulo</Link>
              )
            ) : (
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Sin ruta operativa</p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
