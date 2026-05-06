import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { collectHockerGlobalHealth } from "@/lib/hocker-global-health";
import { collectHockerBetaReadiness } from "@/lib/hocker-beta-readiness";
import { collectHockerMobileSanity } from "@/lib/hocker-mobile-sanity";
import {
  HOCKER_CLIENT_PORTALS,
  evaluateSecurityReadiness,
} from "@/lib/hocker-client-portals";
import { HOCKER_GLOBAL_REAL_EXECUTION_LOCK } from "@/lib/hocker-roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Owner Console · Hocker ONE",
  description: "Consola raíz privada de Armando/Hocker para operar Hocker ONE.",
};

const coreLinks = [
  {
    title: "Launch Readiness",
    href: "/launch",
    description: "Beta readiness, documentación y estado de lanzamiento privado.",
    tag: "launch",
  },
  {
    title: "Global Health",
    href: "/status",
    description: "Salud global de Hocker ONE, NOVA, Supabase, memoria e integraciones.",
    tag: "health",
  },
  {
    title: "Mobile Sanity",
    href: "/mobile",
    description: "Validación PWA/APK, manifest, iconos, navegación móvil y readiness.",
    tag: "mobile",
  },
  {
    title: "Security Readiness",
    href: "/security",
    description: "Hocker ONE privado, portales derivados y accesos temporales/permanentes.",
    tag: "security",
  },
  {
    title: "Access Policy",
    href: "/access",
    description: "Roles base, permisos y bloqueo global de ejecución real.",
    tag: "access",
  },
  {
    title: "Integration Registry",
    href: "/integrations",
    description: "Módulos canónicos y eventos de integración del ecosistema.",
    tag: "integrations",
  },
];

const chidoLinks = [
  { title: "Chido Home", href: "/chido", description: "Vista principal del módulo canónico Chido Casino." },
  { title: "Operación", href: "/chido/ops", description: "Monitoreo read-only de tablas y estado operacional." },
  { title: "Actions", href: "/chido/actions", description: "Contrato de acciones sensibles en dry-run." },
  { title: "Research Gate", href: "/chido/research-gate", description: "Regla previa obligatoria para acciones controladas." },
  { title: "Approvals", href: "/chido/approvals", description: "Capa de aprobaciones por guardianes." },
  { title: "Signatures", href: "/chido/signatures", description: "Validación HMAC para acciones controladas." },
  { title: "Preflight", href: "/chido/preflight", description: "Validación completa sin ejecución real." },
];

function statusClass(status: string): string {
  if (status === "online" || status === "ready") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "warning" || status === "degraded") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  return "border-rose-400/20 bg-rose-500/10 text-rose-300";
}

export default async function OwnerPage() {
  const [globalHealth, beta, mobile] = await Promise.all([
    collectHockerGlobalHealth({ emitEvent: false }),
    collectHockerBetaReadiness({ emitEvent: false }),
    collectHockerMobileSanity({ emitEvent: false }),
  ]);

  const security = evaluateSecurityReadiness();

  return (
    <PageShell
      title="Owner Console"
      subtitle="Panel maestro privado de Armando/Hocker para controlar Hocker ONE, AGIs, módulos y portales derivados."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className="hocker-button-secondary">Dashboard</Link>
          <Link href="/security" className="hocker-button-secondary">Security</Link>
          <Link href="/chido" className="hocker-button-secondary">Chido</Link>
          <Link href="/status" className="hocker-button-primary">Status</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Regla raíz">
          Hocker ONE es owner-only. Los clientes no entran al núcleo: usan portales derivados por servicio, con branding, módulos y permisos específicos controlados desde esta consola.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Global Health</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(globalHealth.status)}`}>
              {globalHealth.status}
            </p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Beta Readiness</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(beta.status)}`}>
              {beta.status}
            </p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Mobile Sanity</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(mobile.status)}`}>
              {mobile.status}
            </p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Execution Lock</p>
            <p className="mt-2 text-sm font-black text-rose-300">
              {HOCKER_GLOBAL_REAL_EXECUTION_LOCK ? "Activo" : "Inactivo"}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {coreLinks.map((item) => (
            <Link key={item.href} href={item.href} className="hocker-panel-pro block p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.03]">
              <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{item.tag}</p>
              <h2 className="mt-2 text-lg font-black text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
            </Link>
          ))}
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Chido Casino</p>
            <h2 className="mt-1 text-lg font-black text-white">Control canónico bloqueado</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Chido opera desde Hocker ONE en read-only, dry-run, approval, signature y preflight. La ejecución real sigue bloqueada.
            </p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-white/5 md:grid-cols-2 md:divide-x md:divide-y-0">
            {chidoLinks.map((item) => (
              <Link key={item.href} href={item.href} className="block p-5 transition hover:bg-white/[0.03]">
                <h3 className="text-sm font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Portales derivados</p>
            <h2 className="mt-1 text-lg font-black text-white">Client Portal Foundation</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {HOCKER_CLIENT_PORTALS.length} portales declarados. Estado security: {security.status}. Clientes solo ven módulos contratados.
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {HOCKER_CLIENT_PORTALS.map((portal) => (
              <article key={portal.portal_id} className="p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{portal.brand_scope}</p>
                    <h3 className="mt-1 text-base font-black text-white">{portal.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{portal.notes}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">{portal.route_prefix}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${portal.risk_level === "critical" ? "border-rose-400/20 bg-rose-500/10 text-rose-300" : "border-cyan-400/20 bg-cyan-500/10 text-cyan-300"}`}>
                    {portal.risk_level}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="hocker-panel-pro p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado operativo</p>
          <h2 className="mt-1 text-xl font-black text-white">Todo visible desde una sola consola.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Esta pantalla centraliza lo construido en los sprints 1A–1G para que sea usable desde web y APK. No desbloquea acciones reales.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
