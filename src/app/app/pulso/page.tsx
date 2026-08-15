import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Clock3, ShieldAlert, Sparkles } from "lucide-react";
import { getHockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";
import { getHockerOperationalSnapshot, type OperationalStatus } from "@/lib/hocker-operational-state";
import { averageCompletion, operationalAgiProgress, operationalAppProgress, percentComplete } from "@/lib/hocker-signal-state.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pulso · Hocker ONE",
  description: "Estado ejecutivo y atención prioritaria del ecosistema HOCKER.",
  robots: { index: false, follow: false, noarchive: true },
};

const ATTENTION_STATUSES = new Set<OperationalStatus>(["degraded", "stale", "offline", "unknown"]);

function statusLabel(status: OperationalStatus) {
  if (status === "online") return "Operativo";
  if (status === "configured") return "Configurado";
  if (status === "protected") return "Protegido";
  if (status === "stale") return "Sin señal reciente";
  if (status === "offline") return "Sin señal";
  if (status === "degraded") return "Revisar";
  if (status === "not_created") return "No creado";
  if (status === "planned") return "Planeado";
  return "Pendiente";
}

function appCompletion(item: Awaited<ReturnType<typeof getHockerOperationalSnapshot>>["apps"][number]) {
  return operationalAppProgress({
    exists: !["not_created", "planned"].includes(item.status),
    hasProductBoundary: Boolean(item.repository || item.href),
    hasRuntimeEvidence: Boolean(item.last_activity_at),
    verifiedNow: item.status === "online",
  });
}

function agiCompletion(item: Awaited<ReturnType<typeof getHockerOperationalSnapshot>>["agis"][number]) {
  return operationalAgiProgress({
    profileRegistered: Boolean(item.registry_status),
    hasHistoricalEvidence: Boolean(item.last_activity_at || item.last_run_status),
    hasRecentEvidence: item.status === "online" || item.status === "degraded",
    healthyNow: item.status === "online",
  });
}

export default async function PulsoPage() {
  const projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
  const [operational, learning] = await Promise.all([
    getHockerOperationalSnapshot(projectId),
    getHockerLivePulseSummary(),
  ]);

  const appsCompletion = averageCompletion(operational.apps.map(appCompletion));
  const agisCompletion = averageCompletion(operational.agis.map(agiCompletion));
  const integrationsCompletion = percentComplete(operational.runtime.counts.tools_connected, operational.runtime.counts.tools_total);

  const attention = [
    ...operational.apps
      .filter((item) => ATTENTION_STATUSES.has(item.status))
      .map((item) => ({ id: `app-${item.key}`, title: item.title, detail: item.evidence, status: item.status, href: item.href || "/status", completion_percent: appCompletion(item) })),
    ...operational.agis
      .filter((item) => ATTENTION_STATUSES.has(item.status))
      .map((item) => ({ id: `agi-${item.key}`, title: item.title, detail: item.evidence, status: item.status, href: "/agis", completion_percent: agiCompletion(item) })),
  ].slice(0, 5);

  const pending = operational.metrics.pending_actions;
  const needsAttention = attention.length + (pending > 0 ? 1 : 0);

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 py-2 sm:py-4">
      <header className="flex flex-col gap-4 border-b border-white/[0.055] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-300">
            <Activity className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hocker One</span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Pulso</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--hko-text-secondary)]">
            Lo que necesita tu atención, lo que está ocurriendo y las señales verificadas más importantes.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-300">
          <span className={`h-2 w-2 rounded-full ${operational.ok ? "bg-emerald-400" : "bg-amber-300"}`} />
          {operational.ok ? "Señal verificada" : "Señal parcial"}
        </div>
      </header>

      <section className="rounded-[20px] border border-white/[0.07] bg-[#07101f]/70 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">Avance verificable</p><h2 className="mt-1 text-lg font-bold text-white">Ecosistema observado</h2></div>
          <p className="max-w-xl text-[10px] leading-5 text-[color:var(--hko-text-secondary)]">Porcentaje de gates observables cumplidos; no es una estimación manual de desarrollo.</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            ["AGIs", agisCompletion, `${operational.agis.length} perfiles observados`],
            ["Apps", appsCompletion, `${operational.apps.length} productos observados`],
            ["Integraciones", integrationsCompletion, `${operational.runtime.counts.tools_connected}/${operational.runtime.counts.tools_total} conexiones verificadas`],
          ].map(([label, value, note]) => (
            <article key={String(label)} className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-bold text-slate-200">{label}</span><strong className="text-lg text-white">{value}%</strong></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-sky-300" style={{ width: `${value}%` }} /></div>
              <p className="mt-2 text-[9px] leading-4 text-[color:var(--hko-text-secondary)]">{note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[22px] border border-white/[0.07] bg-[#07101f]/76 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Prioridad</p>
              <h2 className="mt-1 text-lg font-bold text-white">Requiere atención</h2>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${needsAttention > 0 ? "bg-amber-300/10 text-amber-200" : "bg-emerald-300/10 text-emerald-200"}`}>
              {needsAttention > 0 ? needsAttention : "Todo bien"}
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {pending > 0 ? (
              <Link href="/owner/actions" className="group flex min-h-16 items-center gap-3 rounded-[16px] border border-amber-300/13 bg-amber-300/[0.055] px-4 transition hover:bg-amber-300/[0.08]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-amber-300/10 text-amber-300"><ShieldAlert className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-amber-100">{pending} aprobación{pending === 1 ? "" : "es"}</span>
                  <span className="mt-0.5 block text-[11px] text-amber-100/70">Esperando una decisión humana.</span>
                </span>
                <ArrowRight className="h-4 w-4 text-amber-300/60 transition group-hover:translate-x-0.5" />
              </Link>
            ) : null}

            {attention.map((item) => (
              <Link key={item.id} href={item.href} className="group flex min-h-16 items-center gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.02] px-4 transition hover:bg-white/[0.04]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-white/[0.04] text-slate-300"><Clock3 className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold text-slate-100">{item.title}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{statusLabel(item.status)}</span>
                    <span className="text-[9px] font-bold text-sky-200">{item.completion_percent}%</span>
                  </span>
                  <span className="mt-0.5 block line-clamp-1 text-[11px] text-[color:var(--hko-text-secondary)]">{item.detail}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />
              </Link>
            ))}

            {needsAttention === 0 ? (
              <div className="flex min-h-24 items-center gap-3 rounded-[16px] border border-emerald-300/10 bg-emerald-300/[0.035] px-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <div><p className="text-[13px] font-bold text-emerald-100">Sin bloqueos activos</p><p className="mt-1 text-[11px] text-emerald-100/70">No hay señales críticas ni decisiones pendientes.</p></div>
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-[22px] border border-white/[0.07] bg-[#07101f]/76 p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Actividad</p>
          <h2 className="mt-1 text-lg font-bold text-white">Ahora</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ["Runs", operational.metrics.runs_24h, "24 h"],
              ["Servicios", operational.metrics.verified_services, "verificados"],
              ["Recursos", operational.metrics.configured_tools, "configurados"],
              ["Dispositivos", operational.metrics.fresh_nodes, "con señal"],
            ].map(([label, value, note]) => (
              <div key={String(label)} className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-3.5">
                <p className="text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-300">{label}</p>
                <p className="mt-0.5 text-[9px] text-[color:var(--hko-text-secondary)]">{note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[22px] border border-white/[0.07] bg-[#07101f]/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-300"><Sparkles className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.18em]">SYNTIA</span></div>
            <h2 className="mt-1 text-lg font-bold text-white">Aprendizaje</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[color:var(--hko-text-secondary)]">Sólo aprendizaje aprobado y memoria activa; Hocker One lo observa, las AGIs son quienes incorporan las capacidades.</p>
          </div>
          <Link href="/memory" className="inline-flex min-h-11 items-center justify-center rounded-[13px] border border-white/[0.08] bg-white/[0.03] px-4 text-[11px] font-bold text-slate-200 transition hover:bg-white/[0.06]">Ver memoria</Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            ["Aprobado", learning.counts.approved_learning],
            ["Memoria", learning.counts.active_memory],
            ["Distribuciones", learning.counts.active_agi_updates],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <p className="text-xl font-black text-white">{value}</p>
              <p className="mt-1 text-[10px] font-bold text-[color:var(--hko-text-secondary)]">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
