import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Clock3, RefreshCw } from "lucide-react";

import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import { getHockerOperationalSnapshot, type OperationalStatus } from "@/lib/hocker-operational-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "AGIs | Hocker ONE",
  description: "Estado verificable de perfiles y workers AGI del ecosistema HOCKER.",
  robots: { index: false, follow: false, noarchive: true },
};

function label(status: OperationalStatus): string {
  switch (status) {
    case "online": return "Worker verificado";
    case "degraded": return "Ejecución con error";
    case "configured": return "Perfil registrado";
    case "stale": return "Evidencia histórica";
    case "offline": return "Sin conexión";
    case "not_created": return "Sin worker";
    default: return "Sin verificar";
  }
}

function tone(status: OperationalStatus): string {
  if (status === "online") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (status === "degraded" || status === "offline") return "border-rose-300/25 bg-rose-300/10 text-rose-100";
  if (status === "stale") return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  if (status === "configured") return "border-cyan-300/25 bg-cyan-300/10 text-cyan-100";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

function formatDate(value: string | null): string {
  if (!value) return "Sin ejecución registrada";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  }).format(new Date(value));
}

export default async function AgisPage() {
  const snapshot = await getHockerOperationalSnapshot();
  const verified = snapshot.agis.filter((agi) => agi.status === "online").length;
  const historical = snapshot.agis.filter((agi) => agi.status === "stale").length;

  return (
    <div className="hko-page-flow space-y-5">
      <HockerPageHeader
        eyebrow="Runtime verificable"
        title="Perfiles y workers AGI"
        text="Un perfil documentado no equivale a un worker activo. Esta vista separa registro, ejecución reciente y evidencia histórica."
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="hko-mini-stat"><span>Perfiles canónicos</span><strong>{snapshot.agis.length}</strong></article>
        <article className="hko-mini-stat"><span>Workers verificados</span><strong>{verified}</strong></article>
        <article className="hko-mini-stat"><span>Solo evidencia histórica</span><strong>{historical}</strong></article>
      </section>

      <section className="hko-map-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hko-kicker">Criterio operativo</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              “Worker verificado” exige health check o ejecución reciente. Los estados guardados en catálogo no se usan como prueba de actividad.
            </p>
          </div>
          <Link href="/agis" className="hko-action-secondary inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.agis.map((agi) => (
          <article key={agi.key} className="hko-module-card hko-card-tight">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-100">
                <Bot className="h-5 w-5" />
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] ${tone(agi.status)}`}>
                {label(agi.status)}
              </span>
            </div>

            <h2 className="mt-4 text-xl font-black text-white">{agi.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{agi.role}</p>
            <p className="mt-4 text-sm leading-6 text-slate-300">{agi.evidence}</p>

            <div className="mt-4 space-y-2 rounded-2xl border border-white/8 bg-slate-950/45 p-4 text-xs text-slate-400">
              <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Última actividad: {formatDate(agi.last_activity_at)}</p>
              <p>Último run: {agi.last_run_status ?? "—"}</p>
              <p>Worker: {agi.worker_id ?? "No identificado"}</p>
              <p>Estado de catálogo: {agi.registry_status ?? "Sin registro"}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
