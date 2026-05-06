import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import {
  evaluateHockerSecurityHardening,
  HOCKER_SECURITY_HARDENING_VERSION,
} from "@/lib/hocker-security-hardening";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Security Hardening · Hocker ONE",
  description: "Auth, API gates y preparación RLS para Hocker ONE.",
};

function statusClass(status: string): string {
  if (status === "ready") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "warning") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  return "border-rose-400/20 bg-rose-500/10 text-rose-300";
}

export default function SecurityHardeningPage() {
  const hardening = evaluateHockerSecurityHardening();

  return (
    <PageShell
      title="Security Hardening"
      subtitle="Capa de endurecimiento para Owner Console, API gates, grants lógicos y preparación RLS."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/owner" className="hocker-button-secondary">Owner</Link>
          <Link href="/security" className="hocker-button-secondary">Security</Link>
          <Link href="/security/grants" className="hocker-button-primary">Grants</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Regla de seguridad">
          Hocker ONE sigue owner-only. Los grants son lógicos y auditables; todavía no crean sesiones reales ni permisos por tenant.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Versión</p>
            <p className="mt-1 text-xs font-black text-white">{HOCKER_SECURITY_HARDENING_VERSION}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Status</p>
            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(hardening.status)}`}>
              {hardening.status}
            </span>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Critical blocked</p>
            <p className="mt-1 text-3xl font-black text-rose-300">{hardening.summary.critical_blocked}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Execution Lock</p>
            <p className="mt-1 text-sm font-black text-rose-300">Activo</p>
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Checks</p>
            <h2 className="mt-1 text-lg font-black text-white">Hardening readiness</h2>
          </div>
          <div className="divide-y divide-white/5">
            {hardening.checks.map((check) => (
              <article key={check.id} className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${statusClass(check.status)}`}>
                      {check.status}
                    </span>
                    <h3 className="mt-3 text-base font-black text-white">{check.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{check.detail}</p>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    critical: {String(check.critical)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="hocker-panel-pro p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Owner-only routes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {hardening.owner_only_routes.map((route) => (
                <span key={route} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                  {route}
                </span>
              ))}
            </div>
          </div>

          <div className="hocker-panel-pro p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Owner-gated APIs</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {hardening.owner_gated_apis.map((route) => (
                <span key={route} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                  {route}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="hocker-panel-pro p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Siguiente fase</p>
          <h2 className="mt-1 text-xl font-black text-white">1I-B será RLS/Tenant Hardening.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            La siguiente capa definirá owner, tenant, portal, grant y políticas Supabase. No se activarán accesos reales hasta que RLS esté validado.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
