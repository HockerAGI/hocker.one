import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { APP_REGISTRY, getStatusLabel, getStatusTone, type AppCategory } from "@/lib/hocker-dashboard";

export const metadata: Metadata = {
  title: "Apps · Hocker ONE",
  description: "Aplicaciones principales del ecosistema Hocker.",
};

const groups: Array<{ key: AppCategory; title: string; text: string; open?: boolean }> = [
  { key: "control", title: "Control", text: "Panel central y operación principal.", open: true },
  { key: "negocio", title: "Negocio", text: "Ventas, publicidad, CRM y productos.", open: true },
  { key: "operacion", title: "Operación", text: "Finanzas, nube, respaldos y datos." },
  { key: "especiales", title: "Apps especiales", text: "Casino, rastreo, seguridad y comunidad." },
];

function AppCard({ app }: { app: (typeof APP_REGISTRY)[number] }) {
  return (
    <article className="hocker-panel-pro overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="hko-logo-tile h-16 w-16 shrink-0">
          {app.logoSrc ? <img src={app.logoSrc} alt={`${app.title} logo`} className="h-13 w-13 object-contain" loading="lazy" /> : <span className="text-lg font-black text-cyan-200">{app.title.slice(0, 1)}</span>}
        </div>
        <span className={["rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest", getStatusTone(app.status)].join(" ")}>{getStatusLabel(app.status)}</span>
      </div>

      <h2 className="mt-5 text-xl font-black text-white">{app.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{app.subtitle}</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{app.note}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={app.href} className="hocker-button-primary">Abrir</Link>
        <details className="w-full rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Ver detalles</summary>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-400">
            <p><strong className="text-slate-200">Conecta:</strong> {app.integration}</p>
            <p><strong className="text-slate-200">Uso:</strong> {app.category === "especiales" ? "Módulo controlado dentro de Apps." : "Módulo operativo del ecosistema."}</p>
          </div>
        </details>
      </div>
    </article>
  );
}

export default function AppsPage() {
  return (
    <PageShell
      eyebrow="Ecosistema"
      title="Apps"
      subtitle="Aplicaciones reales del ecosistema. Cada una muestra qué hace, estado y acceso claro."
    >
      <div className="space-y-4">
        {groups.map((group) => {
          const items = APP_REGISTRY.filter((app) => app.category === group.key);
          if (items.length === 0) return null;

          return (
            <details key={group.key} open={group.open} className="hocker-panel-pro overflow-hidden">
              <summary className="cursor-pointer list-none border-b border-white/5 p-5 transition hover:bg-white/[0.025]">
                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{group.title}</p>
                <h2 className="mt-2 text-xl font-black text-white">{group.text}</h2>
                <p className="mt-2 text-sm text-slate-500">{items.length} módulos</p>
              </summary>

              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {items.map((app) => <AppCard key={app.key} app={app} />)}
              </div>
            </details>
          );
        })}
      </div>
    </PageShell>
  );
}
