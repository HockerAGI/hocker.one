import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Database, RefreshCw, ShieldCheck } from "lucide-react";

import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import { getHockerOperationalSnapshot, type OperationalStatus } from "@/lib/hocker-operational-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Estado | Hocker ONE",
  description: "Estado verificable de servicios, nodos, ejecuciones y acciones del panel privado.",
  robots: { index: false, follow: false, noarchive: true },
};

function statusLabel(status: OperationalStatus | string): string {
  if (status === "online") return "Verificado";
  if (status === "configured") return "Configurado";
  if (status === "stale") return "Sin señal reciente";
  if (status === "offline") return "Sin conexión";
  if (status === "degraded") return "Degradado";
  if (status === "not_created") return "No existe aún";
  return "Sin verificar";
}

function tone(status: OperationalStatus | string): string {
  if (status === "online") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (status === "configured") return "border-cyan-300/25 bg-cyan-300/10 text-cyan-100";
  if (status === "stale") return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  if (status === "offline" || status === "degraded") return "border-rose-300/25 bg-rose-300/10 text-rose-100";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

function formatDate(value: string | null): string {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  }).format(new Date(value));
}

export default async function StatusPage() {
  const snapshot = await getHockerOperationalSnapshot();
  const nova = snapshot.runtime.service_status.nova;
  const supabase = snapshot.runtime.service_status.supabase;
  const appsWithEvidence = snapshot.apps.filter((app) => ["online", "configured", "stale", "degraded", "offline"].includes(app.status));
  const recentAgis = snapshot.agis.filter((agi) => ["online", "degraded", "stale"].includes(agi.status));

  return (
    <div className="hko-page-flow space-y-5">
      <HockerPageHeader
        eyebrow="Lectura operativa"
        title="Estado verificable"
        text="La interfaz distingue una configuración existente de una conexión comprobada y de una señal reciente."
      />

      <section className="hko-map-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hko-kicker">Última comprobación</p>
            <p className="mt-2 text-sm text-slate-300">{formatDate(snapshot.checked_at)}</p>
            <p className="mt-1 text-xs text-slate-500">Fuente: {snapshot.source === "supabase+health" ? "Supabase + health checks" : "lectura parcial"}</p>
          </div>
          <Link href="/status" className="hko-action-secondary inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="hko-mini-stat"><span>Servicios verificados</span><strong>{snapshot.metrics.verified_services}</strong></article>
        <article className="hko-mini-stat"><span>Herramientas configuradas</span><strong>{snapshot.metrics.configured_tools}</strong></article>
        <article className="hko-mini-stat"><span>Nodos con señal</span><strong>{snapshot.metrics.fresh_nodes}</strong></article>
        <article className="hko-mini-stat"><span>Runs en 24 h</span><strong>{snapshot.metrics.runs_24h}</strong></article>
        <article className="hko-mini-stat"><span>Acciones pendientes</span><strong>{snapshot.metrics.pending_actions}</strong></article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="hko-module-card hko-card-tight">
          <div className="flex items-start justify-between gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-100"><Activity className="h-5 w-5" /></span>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone(nova.status)}`}>{statusLabel(nova.status)}</span>
          </div>
          <h2 className="mt-4 text-xl font-black text-white">NOVA</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{nova.detail}</p>
          <p className="mt-3 text-xs text-slate-500">Verificada: {formatDate(nova.last_verified_at)}</p>
        </article>

        <article className="hko-module-card hko-card-tight">
          <div className="flex items-start justify-between gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-100"><Database className="h-5 w-5" /></span>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone(supabase.status)}`}>{statusLabel(supabase.status)}</span>
          </div>
          <h2 className="mt-4 text-xl font-black text-white">Supabase</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{supabase.detail}</p>
          <p className="mt-3 text-xs text-slate-500">Verificada: {formatDate(supabase.last_verified_at)}</p>
        </article>
      </section>

      <section className="hko-map-panel">
        <div className="mb-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-cyan-200" />
          <div>
            <p className="hko-kicker">Aplicaciones y módulos</p>
            <h2 className="mt-1 text-xl font-black text-white">Evidencia disponible</h2>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {appsWithEvidence.map((app) => (
            <article key={app.key} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-black text-white">{app.title}</h3>
                <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${tone(app.status)}`}>{statusLabel(app.status)}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{app.evidence}</p>
              <p className="mt-2 text-xs text-slate-500">Actividad: {formatDate(app.last_activity_at)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="hko-map-panel">
        <p className="hko-kicker">Workers con evidencia</p>
        <h2 className="mt-1 text-xl font-black text-white">Actividad AGI reciente o histórica</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recentAgis.length > 0 ? recentAgis.map((agi) => (
            <article key={agi.key} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-black text-white">{agi.title}</h3>
                <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${tone(agi.status)}`}>{statusLabel(agi.status)}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{agi.evidence}</p>
              <p className="mt-2 text-xs text-slate-500">Última actividad: {formatDate(agi.last_activity_at)}</p>
            </article>
          )) : <p className="text-sm text-slate-500">No hay ejecuciones AGI recientes o históricas dentro del periodo consultado.</p>}
        </div>
      </section>
    </div>
  );
}
