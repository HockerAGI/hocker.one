import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Clock3, RefreshCw } from "lucide-react";

import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import { getAgiCertificationSnapshot, type AgiCertificationCheck } from "@/lib/agi-certification";
import { getHockerOperationalSnapshot, type OperationalStatus } from "@/lib/hocker-operational-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "AGIs | Hocker ONE",
  description: "Estado verificable y certificación de las AGIs del ecosistema HOCKER.",
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

function certificationId(value: string): string {
  return value.trim().toLowerCase().replaceAll("-", "_")
    .replace(/^candy_ads$/, "candy")
    .replace(/^nexpa_agi$/, "nexpa")
    .replace(/^trackhok_agi$/, "trackhok");
}

function missingLabel(check: AgiCertificationCheck): string {
  switch (check) {
    case "canonical_profile": return "perfil";
    case "tools_ready": return "herramientas";
    case "memory_ready": return "memoria";
    case "runtime_evidence": return "ejecución";
    case "allow_actions_guarded": return "gobierno";
    case "individual_eval_suite": return "eval individual";
    default: return check;
  }
}

export default async function AgisPage() {
  const [snapshot, certification] = await Promise.all([
    getHockerOperationalSnapshot(),
    getAgiCertificationSnapshot(),
  ]);
  const verified = snapshot.agis.filter((agi) => agi.status === "online").length;
  const certificationById = new Map(certification.entries.map((entry) => [entry.agi_id, entry]));

  return (
    <div className="hko-page-flow space-y-5">
      <HockerPageHeader
        eyebrow="Runtime verificable"
        title="AGIs: estado y certificación"
        text="Un perfil documentado no equivale a un worker activo. La actividad reciente y la preparación para producción son cosas distintas; esta vista muestra ambas con evidencia, sin convertir permisos bloqueados en una falsa señal de incompletitud."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="hko-mini-stat"><span>Perfiles canónicos</span><strong>{snapshot.agis.length}</strong></article>
        <article className="hko-mini-stat"><span>Workers verificados</span><strong>{verified}</strong></article>
        <article className="hko-mini-stat"><span>Certificación completa</span><strong>{certification.certified}</strong></article>
        <article className="hko-mini-stat"><span>Pendiente</span><strong>{certification.pending}</strong></article>
      </section>

      <section className="hko-map-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hko-kicker">Criterio de Certificación</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              El porcentaje mide cobertura de evidencia: perfil, herramientas autorizadas, memoria, ejecuciones, gobierno de acciones y una eval individual. No mide “inteligencia” ni concede autonomía.
            </p>
          </div>
          <Link href="/agis" className="hko-action-secondary inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.agis.map((agi) => {
          const cert = certificationById.get(certificationId(agi.key));
          const pending = cert?.missing.map(missingLabel) ?? ["evidencia no disponible"];
          return (
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

              <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">Certificación</span>
                  <strong className="text-sm text-white">{cert?.evidence_percent ?? 0}%</strong>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-300" style={{ width: `${cert?.evidence_percent ?? 0}%` }} />
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  {cert?.certified_for_current_scope
                    ? "Completa para su alcance actual."
                    : `Pendiente: ${pending.join(", ")}.`}
                </p>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl border border-white/8 bg-slate-950/45 p-4 text-xs text-slate-400">
                <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Última actividad: {formatDate(agi.last_activity_at)}</p>
                <p>Último run: {agi.last_run_status ?? "—"}</p>
                <p>Worker: {agi.worker_id ?? "No identificado"}</p>
                <p>Estado de catálogo: {agi.registry_status ?? "Sin registro"}</p>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
