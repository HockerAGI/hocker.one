import type { Metadata } from "next";
import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import HockerSection from "@/components/ui-hocker/HockerSection";
import SystemStatusLive from "@/components/SystemStatusLive";

export const metadata: Metadata = {
  title: "Estado | Hocker ONE",
  description: "Estado general del ecosistema HOCKER.",
};

export default function StatusPage() {
  return (
    <div className="space-y-6">
      <HockerPageHeader
        eyebrow="Salud del sistema"
        title="Estado general"
        text="Estado real verificado en vivo: lo que responde, lo que está protegido y lo que sigue en integración."
      />
      <SystemStatusLive />
      <HockerSection
        title="Detalles técnicos"
        text="Configuración fija del sistema. Información interna para auditoría; no es necesaria para operar el panel."
        defaultOpen={false}
      >
        <div className="rounded-[28px] border border-white/8 bg-slate-950/60 p-5 text-sm leading-relaxed text-slate-300">
          <p><strong className="text-white">Owner Gate:</strong> protegido.</p>
          <p className="mt-2"><strong className="text-white">Private Routes:</strong> cerradas por sesión.</p>
          <p className="mt-2"><strong className="text-white">Execution Lock:</strong> activo para acciones sensibles.</p>
          <p className="mt-2"><strong className="text-white">Real Execution:</strong> desactivada en módulos de riesgo.</p>
        </div>
      </HockerSection>
    </div>
  );
}
