import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Brain, Cable, ChevronRight, Grid2X2, LockKeyhole, Plug, ShieldCheck } from "lucide-react";
import { CANONICAL_INTEGRATIONS } from "@/lib/hocker-integrations";
import { getMcpRegistry } from "@/lib/mcp/mcp-registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Recursos · Hocker ONE",
  description: "Capacidades reales disponibles para NOVA y las AGIs.",
  robots: { index: false, follow: false, noarchive: true },
};

function providerDescription(id: string) {
  if (id === "github") return "Código, repositorios, cambios y evidencia de ingeniería.";
  if (id === "supabase") return "Datos, autenticación, seguridad y operaciones de backend.";
  if (id === "vercel") return "Deployments, previews, hosting y observabilidad web.";
  if (id === "openai") return "Modelos y capacidades de IA disponibles bajo el router.";
  if (id === "base44") return "Superagentes y aplicaciones externas cuando estén configurados.";
  return "Capacidad externa registrada en Hocker One.";
}

function providerStatus(configured: boolean, connected: boolean) {
  if (connected) return { label: "Conectado", className: "border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-200" };
  if (configured) return { label: "Preparado", className: "border-amber-300/15 bg-amber-300/[0.07] text-amber-200" };
  return { label: "Pendiente", className: "border-white/[0.07] bg-white/[0.025] text-slate-500" };
}

export default async function RecursosPage() {
  const registry = getMcpRegistry();
  const mcp = registry.isInitialized ? registry.getStatus() : await registry.initializeAll();

  const nativeResources = [
    { id: "nova", name: "NOVA", description: "Orquestación, conversación y coordinación de especialistas.", icon: Bot },
    { id: "owner-gate", name: "Aprobaciones", description: "Gobierno de acciones sensibles con evidencia y MFA cuando corresponde.", icon: LockKeyhole },
    { id: "memory", name: "Memoria", description: "Contexto y aprendizaje gobernado para las AGIs mediante SYNTIA.", icon: Brain },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 py-2 sm:py-4">
      <header className="flex flex-col gap-4 border-b border-white/[0.055] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-300"><Grid2X2 className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Capacidades</span></div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Recursos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Lo que las AGIs pueden usar. Hocker One registra, enruta y gobierna; el aprendizaje pertenece a cada especialista.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/integrations" className="inline-flex min-h-11 items-center gap-2 rounded-[13px] border border-white/[0.07] bg-white/[0.025] px-4 text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.05]"><Plug className="h-3.5 w-3.5" />Detalles</Link>
          <Link href="/agis" className="inline-flex min-h-11 items-center gap-2 rounded-[13px] border border-white/[0.07] bg-white/[0.025] px-4 text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.05]"><Bot className="h-3.5 w-3.5" />AGIs</Link>
          <Link href="/memory" className="inline-flex min-h-11 items-center gap-2 rounded-[13px] border border-white/[0.07] bg-white/[0.025] px-4 text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.05]"><Brain className="h-3.5 w-3.5" />Memoria</Link>
        </div>
      </header>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">HOCKER</p><h2 className="mt-1 text-lg font-bold text-white">Nativos</h2></div>
          <span className="rounded-full border border-sky-300/13 bg-sky-300/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-sky-200">Nativo</span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {nativeResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <article key={resource.id} className="rounded-[20px] border border-white/[0.065] bg-[#07101f]/72 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-[13px] border border-sky-300/10 bg-sky-300/[0.055] text-sky-300"><Icon className="h-4 w-4" /></span>
                <h3 className="mt-4 text-[14px] font-bold text-white">{resource.name}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{resource.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">Proveedores</p><h2 className="mt-1 text-lg font-bold text-white">Conectados</h2></div>
          <p className="text-[10px] text-slate-600">{mcp.connectedProviders}/{mcp.totalProviders} conectados · {mcp.configuredProviders} configurados</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {mcp.providers.map((provider) => {
            const status = providerStatus(provider.configured, provider.connected);
            return (
              <article key={provider.id} className="group rounded-[20px] border border-white/[0.065] bg-[#07101f]/72 p-4 transition hover:border-white/[0.1] hover:bg-[#091426]/80">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-white/[0.03] text-slate-400"><Cable className="h-4 w-4" /></span>
                  <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${status.className}`}>{status.label}</span>
                </div>
                <h3 className="mt-4 text-[14px] font-bold text-white">{provider.name}</h3>
                <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{providerDescription(provider.id)}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[10px] text-slate-600">
                  <span>{provider.toolCount} herramientas</span>
                  <span>{provider.capabilities.length} capacidades</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">Gobierno</p><h2 className="mt-1 text-lg font-bold text-white">Protegido</h2></div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {CANONICAL_INTEGRATIONS.map((integration) => (
            <Link key={integration.module_id} href={integration.dashboard_path} className="group flex min-h-24 items-center gap-4 rounded-[20px] border border-white/[0.065] bg-[#07101f]/72 p-4 transition hover:border-white/[0.1] hover:bg-[#091426]/80">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-amber-300/10 bg-amber-300/[0.055] text-amber-300"><ShieldCheck className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-bold text-white">{integration.name}</span><span className="rounded-full bg-amber-300/[0.07] px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-amber-200">Protegido</span></span>
                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">{integration.description}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </Link>
          ))}
        </div>
      </section>

      <aside className="rounded-[18px] border border-white/[0.055] bg-white/[0.018] px-4 py-3 text-[11px] leading-5 text-slate-600">
        Crear e importar skills, plugins o manifests requiere un pipeline de inspección, sandbox, evaluación y asignación AGI. Ese importador todavía no está habilitado en producción; por eso esta vista no muestra una acción falsa de instalación.
      </aside>
    </div>
  );
}
