import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Clock3, ShieldAlert, Sparkles } from "lucide-react";
import { getHockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";
import { getHockerOperationalSnapshot, type OperationalStatus } from "@/lib/hocker-operational-state";

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
  if (status === "configured") return "Preparado";
  if (status === "protected") return "Protegido";
  if (status === "stale") return "Sin señal reciente";
  if (status === "offline") return "Sin señal";
  if (status === "degraded") return "Revisar";
  return "Pendiente";
}

export default async function PulsoPage() {
  const projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
  const [operational, learning] = await Promise.all([
    getHockerOperationalSnapshot(projectId),
    getHockerLivePulseSummary(),
  ]);

  const attention = [
    ...operational.apps
      .filter((item) => ATTENTION_STATUSES.has(item.status))
      .map((item) => ({ id: `app-${item.key}`, title: item.title, detail: item.evidence, status: item.status, href: item.href || "/status" })),
    ...operational.agis
      .filter((item) => ATTENTION_STATUSES.has(item.status))
      .map((item) => ({ id: `agi-${item.key}`, title: item.title, detail: item.evidence, status: item.status, href: "/agis" })),
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
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Lo que necesita tu atención, lo que está ocurriendo y las señales verificadas más importantes.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[11px] font-semibold text-slate-400">
          <span className={`h-2 w-2 rounded-full ${operational.ok ? "bg-emerald-400" : "bg-amber-300"}`} />
          {operational.ok ? "Señal verificada" : "Señal parcial"}
        </div>
      </header>

      <section className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[22px] border border-white/[0.07] bg-[#07101f]/76 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">Prioridad</p>
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
                  <span className="mt-0.5 block text-[11px] text-amber-100/50">Esperando una decisión humana.</span>
                </span>
                <ArrowRight className="h-4 w-4 text-amber-300/45 transition group-hover:translate-x-0.5" />
              </Link>
            ) : null}

            {attention.map((item) => (
              <Link key={item.id} href={item.href} className="group flex min-h-16 items-center gap-3 rounded-[16px] border border-white/[0.055] bg-white/[0.018] px-4 transition hover:bg-white/[0.035]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-white/[0.035] text-slate-400"><Clock3 className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold text-slate-200">{item.title}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">{statusLabel(item.status)}</span>
                  </span>
                  <span className="mt-0.5 block line-clamp-1 text-[11px] text-slate-600">{item.detail}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </Link>
            ))}

            {needsAttention === 0 ? (
              <div className="flex min-h-24 items-center gap-3 rounded-[16px] border border-emerald-300/10 bg-emerald-300/[0.035] px-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <div><p className="text-[13px] font-bold text-emerald-100">Sin bloqueos activos</p><p className="mt-1 text-[11px] text-emerald-100/50">No hay señales críticas ni decisiones pendientes.</p></div>
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-[22px] border border-white/[0.07] bg-[#07101f]/76 p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">Actividad</p>
          <h2 className="mt-1 text-lg font-bold text-white">Ahora</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ["Runs", operational.metrics.runs_24h, "24 h"],
              ["Servicios", operational.metrics.verified_services, "verificados"],
              ["Recursos", operational.metrics.configured_tools, "configurados"],
              ["Dispositivos", operational.metrics.fresh_nodes, "con señal"],
            ].map(([label, value, note]) => (
              <div key={String(label)} className="rounded-[16px] border border-white/[0.055] bg-white/[0.018] p-3.5">
                <p className="text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{label}</p>
                <p className="mt-0.5 text-[9px] text-slate-700">{note}</p>
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
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Sólo aprendizaje aprobado y memoria activa; Hocker One lo observa, las AGIs son quienes incorporan las capacidades.</p>
          </div>
          <Link href="/memory" className="inline-flex min-h-11 items-center justify-center rounded-[13px] border border-white/[0.07] bg-white/[0.025] px-4 text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.05]">Ver memoria</Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            ["Aprobado", learning.counts.approved_learning],
            ["Memoria", learning.counts.active_memory],
            ["Distribuciones", learning.counts.active_agi_updates],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-[16px] border border-white/[0.05] bg-white/[0.015] px-4 py-3">
              <p className="text-xl font-black text-white">{value}</p>
              <p className="mt-1 text-[10px] font-bold text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
