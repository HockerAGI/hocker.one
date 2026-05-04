import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import {
  collectHockerGlobalHealth,
  HOCKER_GLOBAL_HEALTH_VERSION,
  type HockerGlobalHealthCheck,
} from "@/lib/hocker-global-health";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Global Health · Hocker ONE",
  description: "Cockpit global de salud operativa de Hocker ONE.",
};

function statusClass(status: string): string {
  if (status === "online") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "degraded") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  if (status === "offline") return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  return "border-slate-400/20 bg-slate-500/10 text-slate-300";
}

function categoryLabel(category: HockerGlobalHealthCheck["category"]): string {
  const labels: Record<HockerGlobalHealthCheck["category"], string> = {
    core: "Core",
    infra: "Infra",
    memory: "Memoria",
    agi: "AGI",
    queue: "Queue",
    integration: "Integración",
    module: "Módulo",
  };

  return labels[category] ?? category;
}

function safeDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

export default async function StatusPage() {
  const health = await collectHockerGlobalHealth({
    emitEvent: false,
  });

  return (
    <PageShell
      title="Global Health Center"
      subtitle="Cockpit global para Hocker ONE, NOVA, Supabase, memoria, cola de comandos e integraciones."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/integrations" className="hocker-button-secondary">Integraciones</Link>
          <Link href="/nodes" className="hocker-button-secondary">Nodos</Link>
          <Link href="/dashboard" className="hocker-button-primary">Dashboard</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Centro de mando">
          Este panel no ejecuta acciones. Solo verifica salud operativa y mantiene Hocker ONE listo para escalar módulos, AGIs, APIs y endpoints.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado global</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(health.status)}`}>
              {health.status}
            </p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Checks</p>
            <p className="mt-1 text-3xl font-black text-white">{health.summary.total}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Online</p>
            <p className="mt-1 text-3xl font-black text-emerald-300">{health.summary.online}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Degraded</p>
            <p className="mt-1 text-3xl font-black text-amber-300">{health.summary.degraded}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Offline crítico</p>
            <p className="mt-1 text-3xl font-black text-rose-300">{health.summary.critical_offline}</p>
          </div>
        </section>

        <section className="hocker-panel-pro p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Versión</p>
              <p className="mt-1 text-sm font-black text-white">{HOCKER_GLOBAL_HEALTH_VERSION}</p>
            </div>
            <p className="text-xs font-bold text-slate-500">
              Última revisión: {safeDate(health.checked_at)}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {health.checks.map((check) => (
            <article key={check.id} className="hocker-panel-pro overflow-hidden">
              <div className="border-b border-white/5 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">
                      {categoryLabel(check.category)}
                    </p>
                    <h2 className="mt-1 text-lg font-black text-white">{check.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{check.detail}</p>
                  </div>

                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(check.status)}`}>
                    {check.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Critical</p>
                  <p className={check.critical ? "mt-1 text-xs font-bold text-rose-300" : "mt-1 text-xs font-bold text-slate-300"}>
                    {String(check.critical)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Latency</p>
                  <p className="mt-1 text-xs font-bold text-white">
                    {typeof check.latency_ms === "number" ? `${check.latency_ms}ms` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Source</p>
                  <p className="mt-1 break-all text-xs font-bold text-slate-300">{check.source}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </PageShell>
  );
}
