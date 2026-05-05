import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import {
  HOCKER_CLIENT_PORTALS,
  HOCKER_CLIENT_PORTAL_VERSION,
  evaluateSecurityReadiness,
} from "@/lib/hocker-client-portals";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Security Readiness · Hocker ONE",
  description: "Owner access, portales derivados y matriz de control de Hocker ONE.",
};

function statusClass(status: string): string {
  if (status === "ready") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  return "border-rose-400/20 bg-rose-500/10 text-rose-300";
}

function riskClass(risk: string): string {
  if (risk === "critical") return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  if (risk === "high") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  return "border-cyan-400/20 bg-cyan-500/10 text-cyan-300";
}

export default function SecurityPage() {
  const readiness = evaluateSecurityReadiness();

  return (
    <PageShell
      title="Security Readiness"
      subtitle="Hocker ONE privado, portales derivados y accesos temporales/permanentes controlados."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/launch" className="hocker-button-secondary">Launch</Link>
          <Link href="/access" className="hocker-button-secondary">Access</Link>
          <Link href="/mobile" className="hocker-button-secondary">Mobile</Link>
          <Link href="/dashboard" className="hocker-button-primary">Dashboard</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Regla de arquitectura">
          Hocker ONE es el panel maestro privado. Los clientes usan portales derivados con branding y módulos específicos. Todo acceso se controla desde Hocker ONE.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(readiness.status)}`}>
              {readiness.status}
            </p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Portales derivados</p>
            <p className="mt-1 text-3xl font-black text-white">{HOCKER_CLIENT_PORTALS.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Critical blocked</p>
            <p className="mt-1 text-3xl font-black text-rose-300">{readiness.summary.critical_blocked}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Versión</p>
            <p className="mt-1 text-xs font-black text-white">{HOCKER_CLIENT_PORTAL_VERSION}</p>
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

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Client Portal Foundation</p>
            <h2 className="mt-1 text-lg font-black text-white">Portales derivados por servicio</h2>
          </div>

          <div className="divide-y divide-white/5">
            {HOCKER_CLIENT_PORTALS.map((portal) => (
              <article key={portal.portal_id} className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-300">
                        {portal.brand_scope}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${riskClass(portal.risk_level)}`}>
                        {portal.risk_level}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-black text-white">{portal.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{portal.notes}</p>
                    <p className="mt-2 text-xs text-slate-500">route_prefix: {portal.route_prefix}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {portal.modules.map((module) => (
                        <span key={module} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(portal.status === "locked" ? "blocked" : "ready")}`}>
                    {portal.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="hocker-panel-pro p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Control</p>
          <h2 className="mt-1 text-xl font-black text-white">Los clientes no entran al núcleo.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Hocker ONE controla accesos, módulos, permisos, caducidad y auditoría. Los clientes operan únicamente portales derivados con branding y capacidades contratadas.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
