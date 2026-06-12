import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import {
  HOCKER_BETA_READINESS_VERSION,
  collectHockerBetaReadiness,
  type BetaReadinessStatus,
} from "@/lib/hocker-beta-readiness";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Launch Readiness · Hocker ONE",
  description: "Checklist operativo de lanzamiento beta para Hocker ONE.",
};

function statusClass(status: BetaReadinessStatus): string {
  if (status === "ready") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "warning") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  return "border-rose-400/20 bg-rose-500/10 text-rose-300";
}

function safeDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

export default async function LaunchPage() {
  const readiness = await collectHockerBetaReadiness({
    emitEvent: false,
  });

  return (
    <PageShell
      title="Launch Readiness"
      subtitle="Estado ejecutivo para lanzar Hocker ONE como beta operativa privada."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className="hocker-button-secondary">Dashboard</Link>
          <Link href="/status" className="hocker-button-secondary">Status</Link>
          <Link href="/integrations" className="hocker-button-secondary">Integraciones</Link>
          <Link href="/access" className="hocker-button-secondary">Access</Link>
          <Link href="/chido" className="hocker-button-primary">Chido</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Beta Readiness">
          Este panel valida si Hocker ONE está listo como beta operativa privada. La ejecución real permanece bloqueada aunque los checks estén en verde.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado beta</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(readiness.status)}`}>
              {readiness.status}
            </p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Checks</p>
            <p className="mt-1 text-3xl font-black text-white">{readiness.summary.total}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ready</p>
            <p className="mt-1 text-3xl font-black text-emerald-300">{readiness.summary.ready}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Warning</p>
            <p className="mt-1 text-3xl font-black text-amber-300">{readiness.summary.warning}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Critical blocked</p>
            <p className="mt-1 text-3xl font-black text-rose-300">{readiness.summary.critical_blocked}</p>
          </div>
        </section>

        <section className="hocker-panel-pro p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Versión</p>
              <p className="mt-1 text-sm font-black text-white">{HOCKER_BETA_READINESS_VERSION}</p>
            </div>
            <p className="text-xs font-bold text-slate-500">
              Última revisión: {safeDate(readiness.checked_at)}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {readiness.checks.map((check) => (
            <article key={check.id} className="hocker-panel-pro overflow-hidden">
              <div className="border-b border-white/5 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">
                      {check.critical ? "critical" : "standard"}
                    </p>
                    <h2 className="mt-1 text-lg font-black text-white">{check.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{check.detail}</p>
                  </div>

                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(check.status)}`}>
                    {check.status}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="hocker-panel-pro p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Regla principal</p>
          <h2 className="mt-1 text-xl font-black text-white">Beta sí. Ejecución real todavía no.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Hocker ONE ya puede operar como centro de control beta para monitoreo, memoria, auditoría e integración. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, límites y doble confirmación humana.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
