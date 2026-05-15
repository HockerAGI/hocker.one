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
  { key: "negocio", title: "Negocio", text: "Ventas, publicidad, CRM y productos." },
  { key: "operacion", title: "Operación", text: "Finanzas, nube, respaldos y datos." },
  { key: "especiales", title: "Apps especiales", text: "Casino, rastreo, seguridad y comunidad." },
];

function AppCard({ app }: { app: (typeof APP_REGISTRY)[number] }) {
  return (
    <Link href={app.href} className="hocker-panel-pro group block p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
          {app.logoSrc ? <img src={app.logoSrc} alt="" className="h-11 w-11 object-contain" loading="lazy" /> : <span className="text-lg font-black text-cyan-200">{app.title.slice(0, 1)}</span>}
        </div>
        <span className={["rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest", getStatusTone(app.status)].join(" ")}>{getStatusLabel(app.status)}</span>
      </div>

      <h2 className="mt-5 text-xl font-black text-white">{app.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{app.subtitle}</p>
      <p className="mt-3 text-xs leading-5 text-slate-500">{app.note}</p>
      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Abrir módulo</p>
    </Link>
  );
}

export default function AppsPage() {
  return (
    <PageShell
      eyebrow="Ecosistema"
      title="Apps"
      subtitle="Aplicaciones reales del ecosistema. Chido Casino vive aquí como app protegida, no como sección principal."
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
