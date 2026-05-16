import type { Metadata } from "next";
import { AGI_GROUP_LABELS, AGI_REGISTRY } from "@/lib/hocker-dashboard";
import AgiCard from "@/components/ui-hocker/AgiCard";
import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import HockerSection from "@/components/ui-hocker/HockerSection";
import NovaCorePanel from "@/components/ui-hocker/NovaCorePanel";

export const metadata: Metadata = {
  title: "AGIs | Hocker ONE",
  description: "Mapa jerárquico de inteligencias del ecosistema HOCKER.",
};

export default function AgisPage() {
  return (
    <div className="space-y-6">
      <HockerPageHeader eyebrow="Inteligencias" title="AGIs" text="Las AGIs no son apps. Son inteligencias internas con roles, niveles y conexiones dentro del ecosistema." />
      <NovaCorePanel />
      <section className="rounded-[34px] border border-white/8 bg-white/[0.035] p-5 sm:p-6">
        <p className="hko-kicker">Mapa rápido</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/8 p-4 text-center text-sm font-black text-cyan-100">NOVA</div>
          <div className="rounded-3xl border border-sky-300/15 bg-sky-300/8 p-4 text-center text-sm font-black text-sky-100">Syntia · Vertx · Curvewind</div>
          <div className="rounded-3xl border border-violet-300/15 bg-violet-300/8 p-4 text-center text-sm font-black text-violet-100">Creativas y clientes</div>
          <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/8 p-4 text-center text-sm font-black text-emerald-100">Operativas</div>
        </div>
      </section>
      {(Object.keys(AGI_GROUP_LABELS) as Array<keyof typeof AGI_GROUP_LABELS>).filter((group) => group !== "core").map((group, index) => {
        const meta = AGI_GROUP_LABELS[group];
        const items = AGI_REGISTRY.filter((agi) => agi.group === group);
        return (
          <HockerSection key={group} title={meta.title} text={meta.text} defaultOpen={index < 2}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((agi) => <AgiCard key={agi.key} agi={agi} />)}
            </div>
          </HockerSection>
        );
      })}
    </div>
  );
}
