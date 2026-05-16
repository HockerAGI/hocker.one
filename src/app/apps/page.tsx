import type { Metadata } from "next";
import { APP_GROUP_LABELS, APP_REGISTRY } from "@/lib/hocker-dashboard";
import AppCard from "@/components/ui-hocker/AppCard";
import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import HockerSection from "@/components/ui-hocker/HockerSection";

export const metadata: Metadata = {
  title: "Apps | Hocker ONE",
  description: "Apps oficiales del ecosistema HOCKER.",
};

export default function AppsPage() {
  return (
    <div className="space-y-6">
      <HockerPageHeader eyebrow="Ecosistema" title="Apps" text="Aquí están las plataformas del ecosistema. Cada una muestra qué hace, su estado real y dónde abrirla." />
      {(Object.keys(APP_GROUP_LABELS) as Array<keyof typeof APP_GROUP_LABELS>).map((group, index) => {
        const meta = APP_GROUP_LABELS[group];
        const items = APP_REGISTRY.filter((app) => app.group === group);
        return (
          <HockerSection key={group} title={meta.title} text={meta.text} defaultOpen={index < 2}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((app) => <AppCard key={app.key} app={app} featured={app.key === "hocker-one"} />)}
            </div>
          </HockerSection>
        );
      })}
    </div>
  );
}
