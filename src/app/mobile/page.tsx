import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { HOCKER_MOBILE_SANITY_VERSION, collectHockerMobileSanity, type MobileSanityStatus } from "@/lib/hocker-mobile-sanity";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "App móvil · Hocker ONE",
  description: "Revisión móvil y PWA de Hocker ONE.",
};

function statusClass(status: MobileSanityStatus): string {
  if (status === "ready") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "warning") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  return "border-rose-400/20 bg-rose-500/10 text-rose-300";
}

function statusLabel(status: MobileSanityStatus): string {
  if (status === "ready") return "Lista";
  if (status === "warning") return "Requiere revisión";
  return "Bloqueada";
}

function safeDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

export default async function MobilePage() {
  const sanity = await collectHockerMobileSanity({ emitEvent: false });

  return (
    <PageShell
      title="App móvil"
      subtitle="Revisión de navegación móvil, PWA, iconos y rutas principales."
      actions={<div className="flex flex-wrap gap-2"><Link href="/status" className="hocker-button-ghost">Estado</Link><Link href="/dashboard" className="hocker-button-primary">Resumen</Link></div>}
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Móvil</p><p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(sanity.status)}`}>{statusLabel(sanity.status)}</p></div>
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Revisiones</p><p className="mt-1 text-3xl font-black text-white">{sanity.summary.total}</p></div>
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Listas</p><p className="mt-1 text-3xl font-black text-emerald-300">{sanity.summary.ready}</p></div>
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Por revisar</p><p className="mt-1 text-3xl font-black text-amber-300">{sanity.summary.warning + sanity.summary.critical_blocked}</p></div>
        </section>

        <section className="hocker-panel-pro p-5"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Última revisión</p><p className="mt-1 text-sm font-black text-white">{safeDate(sanity.checked_at)}</p><details className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3"><summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Detalles técnicos</summary><p className="mt-2 text-xs text-slate-500">Versión: {HOCKER_MOBILE_SANITY_VERSION}</p></details></section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {sanity.checks.map((check) => (
            <article key={check.id} className="hocker-panel-pro p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{check.critical ? "Importante" : "Revisión"}</p><h2 className="mt-1 text-lg font-black text-white">{check.label}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{check.detail}</p></div><span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(check.status)}`}>{statusLabel(check.status)}</span></div>
            </article>
          ))}
        </section>

        <section className="hocker-panel-pro p-5"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Regla principal</p><h2 className="mt-1 text-xl font-black text-white">Móvil claro. Ejecución real bloqueada.</h2><p className="mt-3 text-sm leading-6 text-slate-400">Esta vista revisa experiencia móvil. No cambia permisos, dinero, balances ni acciones reales.</p></section>
      </div>
    </PageShell>
  );
}
