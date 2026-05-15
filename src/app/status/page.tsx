import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { collectHockerGlobalHealth, HOCKER_GLOBAL_HEALTH_VERSION, type HockerGlobalHealthCheck } from "@/lib/hocker-global-health";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Estado general · Hocker ONE",
  description: "Salud operativa de Hocker ONE en lenguaje claro.",
};

function statusClass(status: string): string {
  if (status === "online") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "degraded") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  if (status === "offline") return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  return "border-slate-400/20 bg-slate-500/10 text-slate-300";
}

function statusLabel(status: string): string {
  if (status === "online") return "Activo";
  if (status === "degraded") return "Requiere revisión";
  if (status === "offline") return "Sin conexión";
  return "Pendiente";
}

function categoryLabel(category: HockerGlobalHealthCheck["category"]): string {
  const labels: Record<HockerGlobalHealthCheck["category"], string> = {
    core: "Sistema",
    infra: "Infraestructura",
    memory: "Memoria",
    agi: "AGIs",
    queue: "Tareas",
    integration: "Integraciones",
    module: "Módulo",
  };
  return labels[category] ?? category;
}

function safeDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

export default async function StatusPage() {
  const health = await collectHockerGlobalHealth({ emitEvent: false });

  return (
    <PageShell
      title="Estado general"
      subtitle="Revisión clara de sistema, memoria, tareas, integraciones y módulos."
      actions={<div className="flex flex-wrap gap-2"><Link href="/integrations" className="hocker-button-ghost">Integraciones</Link><Link href="/dashboard" className="hocker-button-primary">Resumen</Link></div>}
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Sistema</p><p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(health.status)}`}>{statusLabel(health.status)}</p></div>
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Revisiones</p><p className="mt-1 text-3xl font-black text-white">{health.summary.total}</p></div>
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Activas</p><p className="mt-1 text-3xl font-black text-emerald-300">{health.summary.online}</p></div>
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Por revisar</p><p className="mt-1 text-3xl font-black text-amber-300">{health.summary.degraded + health.summary.critical_offline}</p></div>
        </section>

        <section className="hocker-panel-pro p-5"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Última revisión</p><p className="mt-1 text-sm font-black text-white">{safeDate(health.checked_at)}</p><details className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3"><summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Detalles técnicos</summary><p className="mt-2 text-xs text-slate-500">Versión: {HOCKER_GLOBAL_HEALTH_VERSION}</p></details></section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {health.checks.map((check) => (
            <article key={check.id} className="hocker-panel-pro overflow-hidden p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div><p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{categoryLabel(check.category)}</p><h2 className="mt-1 text-lg font-black text-white">{check.label}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{check.detail}</p></div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(check.status)}`}>{statusLabel(check.status)}</span>
              </div>
              <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3"><summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Detalles técnicos</summary><div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3"><p>Crítico: {check.critical ? "sí" : "no"}</p><p>Tiempo: {typeof check.latency_ms === "number" ? `${check.latency_ms}ms` : "—"}</p><p className="break-all">Origen: {check.source}</p></div></details>
            </article>
          ))}
        </section>
      </div>
    </PageShell>
  );
}
