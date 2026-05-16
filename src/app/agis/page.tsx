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
    <div className="hko-page-flow space-y-5">
      <HockerPageHeader eyebrow="Inteligencias" title="AGIs" text="No son apps. Son inteligencias internas con roles, niveles y conexiones dentro del ecosistema." />
      <NovaCorePanel variant="nova" />
      <section className="hko-map-panel">
        <p className="hko-kicker">Mapa rápido</p>
        <div className="hko-hierarchy-map mt-4">
          <div className="hko-map-node hko-map-node-primary">NOVA</div>
          <div className="hko-map-line" />
          <div className="hko-map-node">Syntia · Vertx · Curvewind</div>
          <div className="hko-map-line" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="hko-map-node">Creativas y clientes</div>
            <div className="hko-map-node">Operativas</div>
          </div>
        </div>
      </section>
      {(Object.keys(AGI_GROUP_LABELS) as Array<keyof typeof AGI_GROUP_LABELS>).filter((group) => group !== "core").map((group, index) => {
        const meta = AGI_GROUP_LABELS[group];
        const items = AGI_REGISTRY.filter((agi) => agi.group === group);
        return (
          <HockerSection key={group} title={meta.title} text={meta.text} defaultOpen={index < 2}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((agi) => <AgiCard key={agi.key} agi={agi} />)}</div>
          </HockerSection>
        );
      })}
    </div>
  );
}
