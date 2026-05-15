import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { AGI_REGISTRY, getStatusLabel, getStatusTone, type AgiCategory } from "@/lib/hocker-dashboard";

export const metadata: Metadata = {
  title: "AGIs · Hocker ONE",
  description: "Mapa simple de inteligencias del ecosistema Hocker.",
};

const groups: Array<{ key: AgiCategory; title: string; text: string; open?: boolean }> = [
  { key: "nucleo", title: "Núcleo", text: "NOVA coordina todo el ecosistema.", open: true },
  { key: "tridente", title: "Tridente estratégico", text: "Memoria, seguridad y predicción.", open: true },
  { key: "creativas", title: "Creativas y clientes", text: "Contenido, campañas, producción, atención y ventas.", open: true },
  { key: "operativas", title: "Operativas", text: "Infraestructura, legal, finanzas, casino y monitoreo." },
];

function AgiCard({ agi }: { agi: (typeof AGI_REGISTRY)[number] }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#0b1526] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hko-logo-tile h-12 w-12 shrink-0">
            {agi.logoSrc ? <img src={agi.logoSrc} alt={`${agi.title} logo`} className="h-10 w-10 object-contain" loading="lazy" /> : <span className="text-sm font-black text-cyan-200">{agi.title.slice(0, 2).toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-white">{agi.title}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-300">{agi.subtitle}</p>
          </div>
        </div>
        <span className={["shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest", getStatusTone(agi.status)].join(" ")}>{getStatusLabel(agi.status)}</span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">{agi.note}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={agi.href} className="hocker-button-ghost">Abrir</Link>
        <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.20em] text-cyan-200">{agi.integration}</span>
      </div>
    </article>
  );
}

export default function AgisPage() {
  return (
    <PageShell
      eyebrow="Inteligencias"
      title="AGIs"
      subtitle="NOVA arriba, Tridente después y módulos por función. Sin tecnicismos innecesarios."
    >
      <div className="space-y-4">
        {groups.map((group) => {
          const items = AGI_REGISTRY.filter((agi) => agi.category === group.key);
          if (items.length === 0) return null;

          return (
            <details key={group.key} open={group.open} className="hocker-panel-pro overflow-hidden">
              <summary className="cursor-pointer list-none border-b border-white/5 p-5 transition hover:bg-white/[0.025]">
                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{group.title}</p>
                <h2 className="mt-2 text-xl font-black text-white">{group.text}</h2>
                <p className="mt-2 text-sm text-slate-500">{items.length} inteligencias</p>
              </summary>

              <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
                {items.map((agi) => <AgiCard key={agi.key} agi={agi} />)}
              </div>
            </details>
          );
        })}
      </div>
    </PageShell>
  );
}
