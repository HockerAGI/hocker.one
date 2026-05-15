import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { collectHockerGlobalHealth } from "@/lib/hocker-global-health";
import { collectHockerBetaReadiness } from "@/lib/hocker-beta-readiness";
import { collectHockerMobileSanity } from "@/lib/hocker-mobile-sanity";
import { evaluateSecurityReadiness } from "@/lib/hocker-client-portals";
import { HOCKER_GLOBAL_REAL_EXECUTION_LOCK } from "@/lib/hocker-roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Inicio privado · Hocker ONE",
  description: "Panel maestro privado de Armando/Hocker.",
};

const mainSections = [
  { title: "Apps", href: "/apps", description: "Hocker ONE, Hocker Ads, Chido Casino, TrackHok, Wallet, Drive, Hub, Up y Supply.", tag: "Ecosistema" },
  { title: "AGIs", href: "/agis", description: "NOVA, Tridente estratégico, creativas, soporte, ventas y operación.", tag: "Inteligencias" },
  { title: "Seguridad", href: "/security", description: "Accesos, rutas privadas, bloqueo de ejecución y protección del sistema.", tag: "Control" },
  { title: "Estado", href: "/status", description: "Lectura simple del sistema, app móvil, integraciones y salud general.", tag: "Sistema" },
];

const quickLinks = [
  { title: "Memoria", href: "/memory", description: "Syntia, contexto y continuidad." },
  { title: "Integraciones", href: "/integrations", description: "Conexiones y servicios externos." },
  { title: "Tareas", href: "/commands", description: "Acciones pendientes y comandos." },
  { title: "Portales", href: "/security/grants", description: "Permisos y accesos derivados." },
];

function statusClass(status: string): string {
  if (status === "online" || status === "ready") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "warning" || status === "degraded") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  return "border-rose-400/20 bg-rose-500/10 text-rose-300";
}

function statusText(status: string): string {
  if (status === "online" || status === "ready") return "Activo";
  if (status === "warning" || status === "degraded") return "Revisión";
  return "Requiere revisión";
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
      eyebrow="Privado"
      title="Inicio"
      subtitle="Panel maestro de Hocker ONE. Todo está agrupado para operar sin ruido y sin mezclar apps con AGIs."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/apps" className="hocker-button-secondary">Apps</Link>
          <Link href="/agis" className="hocker-button-secondary">AGIs</Link>
          <Link href="/security" className="hocker-button-secondary">Seguridad</Link>
          <Link href="/status" className="hocker-button-primary">Estado</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="NOVA sincronizada">
          El ecosistema se mantiene bajo supervisión. Las acciones sensibles siguen bloqueadas hasta tener autorización real.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado general</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(globalHealth.status)}`}>{statusText(globalHealth.status)}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Lanzamiento</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(beta.status)}`}>{statusText(beta.status)}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">App móvil</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(mobile.status)}`}>{statusText(mobile.status)}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ejecución real</p>
            <p className={HOCKER_GLOBAL_REAL_EXECUTION_LOCK ? "mt-2 inline-flex rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-300" : "mt-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300"}>
              {HOCKER_GLOBAL_REAL_EXECUTION_LOCK ? "Bloqueada" : "Abierta"}
            </p>
          </div>
        </section>

        <details open className="hocker-panel-pro overflow-hidden">
          <summary className="cursor-pointer list-none border-b border-white/5 p-5 transition hover:bg-white/[0.025]">
            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Principal</p>
            <h2 className="mt-2 text-xl font-black text-white">Secciones del ecosistema</h2>
            <p className="mt-2 text-sm text-slate-500">Chido Casino está dentro de Apps.</p>
          </summary>
          <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
            {mainSections.map((item) => (
              <Link key={item.href} href={item.href} className="hocker-panel-pro block p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.03]">
                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{item.tag}</p>
                <h3 className="mt-2 text-xl font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </details>

        <details className="hocker-panel-pro overflow-hidden">
          <summary className="cursor-pointer list-none border-b border-white/5 p-5 transition hover:bg-white/[0.025]">
            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Accesos rápidos</p>
            <h2 className="mt-2 text-xl font-black text-white">Módulos secundarios</h2>
            <p className="mt-2 text-sm text-slate-500">Se mantienen cerrados para no saturar.</p>
          </summary>
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-[22px] border border-white/10 bg-[#0b1526] p-5 transition hover:border-cyan-400/25 hover:bg-white/[0.03]">
                <h3 className="text-base font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </details>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href="/security/grants" className="hocker-panel-pro block p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Portales</p>
            <h2 className="mt-2 text-xl font-black text-white">Portales de clientes</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Permisos, solicitudes y accesos derivados. Estado: {security.status}.</p>
          </Link>
          <Link href="/empresa" className="hocker-panel-pro block p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Empresa</p>
            <h2 className="mt-2 text-xl font-black text-white">Sitio público preparado</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Base pública de Hocker AGI Technologies sin datos privados.</p>
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
