import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { APP_REGISTRY, AGI_REGISTRY, getStatusLabel, getStatusTone } from "@/lib/hocker-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Inicio privado · Hocker ONE",
  description: "Centro privado del ecosistema Hocker.",
};

function MiniLogo({ src, name }: { src?: string; name: string }) {
  return (
    <div className="hko-logo-tile h-11 w-11 shrink-0">
      {src ? <img src={src} alt="" className="h-9 w-9 object-contain" /> : <span className="text-xs font-black text-cyan-200">{name.slice(0, 2).toUpperCase()}</span>}
    </div>
  );
}

function QuickCard({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className="hocker-panel-pro block p-5 transition hover:border-cyan-400/25 hover:bg-white/[0.03]">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Abrir</p>
    </Link>
  );
}

export default function OwnerPage() {
  const topApps = APP_REGISTRY.slice(0, 4);
  const topAgis = AGI_REGISTRY.slice(0, 4);

  return (
    <PageShell
      eyebrow="Inicio privado"
      title="Tu centro de control privado"
      subtitle="Desde aquí ves apps, AGIs, seguridad, estado y tareas sin ruido técnico."
    >
      <div className="space-y-6">
        <section className="hocker-panel-pro overflow-hidden p-6">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">NOVA</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">NOVA está sincronizada.</h2>
              <p className="mt-4 text-base leading-7 text-slate-300">El ecosistema se mantiene bajo supervisión. Las acciones sensibles siguen protegidas y la ejecución real continúa bloqueada.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-emerald-400/15 bg-emerald-400/10 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Sistema</p><p className="mt-2 text-xl font-black text-white">Activo</p></div>
              <div className="rounded-3xl border border-sky-400/15 bg-sky-400/10 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-sky-200">Acceso</p><p className="mt-2 text-xl font-black text-white">Protegido</p></div>
              <div className="rounded-3xl border border-amber-400/15 bg-amber-400/10 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-amber-200">Ejecución</p><p className="mt-2 text-xl font-black text-white">Bloqueada</p></div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickCard href="/apps" title="Apps" text="Aplicaciones del ecosistema con logos, estado y acceso." />
          <QuickCard href="/agis" title="AGIs" text="Mapa de inteligencias por jerarquía y función." />
          <QuickCard href="/status" title="Estado" text="Salud general explicada en lenguaje claro." />
          <QuickCard href="/commands" title="Tareas" text="Instrucciones, aprobaciones y seguimiento." />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <details open className="hocker-panel-pro overflow-hidden">
            <summary className="cursor-pointer list-none border-b border-white/5 p-5"><p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Apps principales</p><h2 className="mt-2 text-xl font-black text-white">Acceso rápido</h2></summary>
            <div className="divide-y divide-white/5">
              {topApps.map((app) => (
                <Link key={app.key} href={app.href} className="flex items-center gap-3 p-4 transition hover:bg-white/[0.025]">
                  <MiniLogo src={app.logoSrc} name={app.title} />
                  <div className="min-w-0 flex-1"><p className="font-black text-white">{app.title}</p><p className="text-sm text-slate-400">{app.subtitle}</p></div>
                  <span className={["rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest", getStatusTone(app.status)].join(" ")}>{getStatusLabel(app.status)}</span>
                </Link>
              ))}
            </div>
          </details>

          <details open className="hocker-panel-pro overflow-hidden">
            <summary className="cursor-pointer list-none border-b border-white/5 p-5"><p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">AGIs principales</p><h2 className="mt-2 text-xl font-black text-white">Núcleo y Tridente</h2></summary>
            <div className="divide-y divide-white/5">
              {topAgis.map((agi) => (
                <Link key={agi.key} href={agi.href} className="flex items-center gap-3 p-4 transition hover:bg-white/[0.025]">
                  <MiniLogo src={agi.logoSrc} name={agi.title} />
                  <div className="min-w-0 flex-1"><p className="font-black text-white">{agi.title}</p><p className="text-sm text-slate-400">{agi.subtitle}</p></div>
                  <span className={["rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest", getStatusTone(agi.status)].join(" ")}>{getStatusLabel(agi.status)}</span>
                </Link>
              ))}
            </div>
          </details>
        </section>
      </div>
    </PageShell>
  );
}
