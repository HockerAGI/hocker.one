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
  { title: "Apps", href: "/apps", description: "Hocker ONE, Hocker Ads, Chido Casino, NEXPA, Trackhok y más.", tag: "Ecosistema" },
  { title: "AGIs", href: "/agis", description: "NOVA, Syntia, Vertx, Candy Ads, PRO IA, Numia, Jurix y demás inteligencias.", tag: "Inteligencias" },
  { title: "Servicios", href: "/servicios", description: "Publicidad, branding, automatización, CRM, landing pages y contenido.", tag: "Oferta" },
  { title: "Seguridad", href: "/security", description: "Accesos, permisos, bloqueo de ejecución, rutas privadas y RLS.", tag: "Control" },
];

const chidoSections = [
  { title: "Estado", href: "/chido", description: "Vista principal de Chido Casino." },
  { title: "Operación", href: "/chido/ops", description: "Monitoreo sin ejecución real." },
  { title: "Prueba segura", href: "/chido/actions", description: "Acciones sensibles en modo prueba." },
  { title: "Revisión previa", href: "/chido/research-gate", description: "Filtro obligatorio antes de aprobar." },
  { title: "Aprobaciones", href: "/chido/approvals", description: "Decisiones controladas por guardianes." },
  { title: "Firmas", href: "/chido/signatures", description: "Validación de seguridad." },
  { title: "Revisión final", href: "/chido/preflight", description: "Último chequeo sin ejecutar." },
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
      eyebrow="Privado"
      title="Inicio"
      subtitle="Panel maestro privado de Armando/Hocker. Todo está separado por áreas para no saturar la vista."
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
        <Hint title="Regla de acceso">
          Hocker ONE es privado. Quien tenga un link no entra al núcleo sin sesión válida. El sitio público de empresa vive separado y no muestra datos internos.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado general</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(globalHealth.status)}`}>{globalHealth.status}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Lanzamiento</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(beta.status)}`}>{beta.status}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">App móvil</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(mobile.status)}`}>{mobile.status}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ejecución real</p>
            <p className="mt-2 text-sm font-black text-rose-300">{HOCKER_GLOBAL_REAL_EXECUTION_LOCK ? "Bloqueada" : "Abierta"}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {mainSections.map((item) => (
            <Link key={item.href} href={item.href} className="hocker-panel-pro block p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.03]">
              <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{item.tag}</p>
              <h2 className="mt-2 text-xl font-black text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
            </Link>
          ))}
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-rose-300">Chido Casino</p>
            <h2 className="mt-1 text-xl font-black text-white">Control separado y bloqueado</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Chido se revisa desde Hocker ONE, pero la ejecución real sigue bloqueada. Las palabras técnicas se muestran como revisión, prueba, firma y aprobación.
            </p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-white/5 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
            {chidoSections.map((item) => (
              <Link key={item.href} href={item.href} className="block p-5 transition hover:bg-white/[0.03]">
                <h3 className="text-sm font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href="/security/grants" className="hocker-panel-pro block p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Portales</p>
            <h2 className="mt-2 text-xl font-black text-white">Portales de clientes</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Permisos, solicitudes y accesos derivados. Estado: {security.status}.</p>
          </Link>
          <Link href="/empresa" className="hocker-panel-pro block p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Empresa</p>
            <h2 className="mt-2 text-xl font-black text-white">Sitio público preparado</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Base lista para Hocker AGI Technologies sin mostrar datos privados.</p>
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
