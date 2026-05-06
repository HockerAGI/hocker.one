import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import {
  evaluateTenantRlsReadiness,
  HOCKER_TENANT_RLS_VERSION,
} from "@/lib/hocker-tenant-rls";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Tenant RLS · Hocker ONE",
  description: "Modelo RLS/Tenant para portales derivados de Hocker ONE.",
};

function statusClass(status: string): string {
  if (status === "ready") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "warning") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  return "border-rose-400/20 bg-rose-500/10 text-rose-300";
}

export default function TenantRlsPage() {
  const rls = evaluateTenantRlsReadiness();

  return (
    <PageShell
      title="Tenant RLS"
      subtitle="Modelo de aislamiento por owner, tenant, portal, grant, módulo y permiso."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/owner" className="hocker-button-secondary">Owner</Link>
          <Link href="/security/hardening" className="hocker-button-secondary">Hardening</Link>
          <Link href="/security/grants" className="hocker-button-primary">Grants</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Regla 1I-B">
          Esta capa prepara RLS real sin activarlo sobre tablas críticas actuales. Primero se valida contrato, migration y modelo de aislamiento.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Versión</p>
            <p className="mt-1 text-xs font-black text-white">{HOCKER_TENANT_RLS_VERSION}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Status</p>
            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(rls.status)}`}>
              {rls.status}
            </span>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Critical blocked</p>
            <p className="mt-1 text-3xl font-black text-rose-300">{rls.summary.critical_blocked}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">RLS live</p>
            <p className="mt-1 text-sm font-black text-amber-300">Prepared</p>
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Checks</p>
            <h2 className="mt-1 text-lg font-black text-white">Tenant/RLS readiness</h2>
          </div>
          <div className="divide-y divide-white/5">
            {rls.checks.map((check) => (
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
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Policy fields</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {rls.policy_fields.map((field) => (
                <span key={field} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                  {field}
                </span>
              ))}
            </div>
          </div>

          <div className="hocker-panel-pro p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tenant scopes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {rls.tenant_scopes.map((scope) => (
                <span key={scope} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                  {scope}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Portales</p>
            <h2 className="mt-1 text-lg font-black text-white">Portal RLS model</h2>
          </div>
          <div className="divide-y divide-white/5">
            {rls.portal_rls_model.map((portal) => (
              <article key={portal.portal_id} className="p-5">
                <h3 className="text-base font-black text-white">{portal.portal_id}</h3>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
                  {portal.tenant_scope}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {portal.allowed_modules.map((module) => (
                    <span key={module} className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
                      {module}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {portal.blocked_permissions.map((permission) => (
                    <span key={permission} className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-rose-300">
                      block: {permission}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="hocker-panel-pro p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado</p>
          <h2 className="mt-1 text-xl font-black text-white">Preparado, no aplicado a producción todavía.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            El siguiente paso será aplicar migration en Supabase con rollback controlado, cuando confirmemos el esquema final de tenants.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
