import type { Metadata } from "next";
import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import HockerSection from "@/components/ui-hocker/HockerSection";
import StatusBadge from "@/components/ui-hocker/StatusBadge";

export const metadata: Metadata = {
  title: "Mobile | Hocker ONE",
  description: "Vista móvil y PWA de Hocker ONE.",
};

export default function MobilePage() {
  return (
    <div className="space-y-6">
      <HockerPageHeader eyebrow="Móvil" title="Vista móvil" text="La experiencia móvil debe ser clara: inicio, apps, AGIs, NOVA y tareas al alcance del pulgar." />
      <section className="grid gap-4 md:grid-cols-3">
        <article className="hko-module-card"><StatusBadge status="integration" /><h3 className="mt-4 text-lg font-black text-white">Navegación inferior</h3><p className="mt-2 text-sm text-slate-400">Máximo cinco accesos principales para no saturar.</p></article>
        <article className="hko-module-card"><StatusBadge status="integration" /><h3 className="mt-4 text-lg font-black text-white">Cards claras</h3><p className="mt-2 text-sm text-slate-400">Logo, nombre, estado y acción principal.</p></article>
        <article className="hko-module-card"><StatusBadge status="pending" /><h3 className="mt-4 text-lg font-black text-white">PWA</h3><p className="mt-2 text-sm text-slate-400">Iconos y manifest deben validarse antes de empaquetar Android.</p></article>
      </section>
      <HockerSection title="Regla móvil" text="Chido no aparece como pestaña principal; vive dentro de Apps." defaultOpen>
        <p className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 text-sm leading-relaxed text-slate-300">La interfaz móvil prioriza orientación y claridad. Los detalles técnicos deben abrirse solo cuando los necesites.</p>
      </HockerSection>
    </div>
  );
}
