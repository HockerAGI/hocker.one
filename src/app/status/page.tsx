import type { Metadata } from "next";
import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import HockerSection from "@/components/ui-hocker/HockerSection";
import StatusBadge from "@/components/ui-hocker/StatusBadge";

export const metadata: Metadata = {
  title: "Estado | Hocker ONE",
  description: "Estado general del ecosistema HOCKER.",
};

const rows = [
  { label: "Sistema", status: "live", text: "Hocker ONE compila y responde." },
  { label: "Login", status: "live", text: "Acceso owner validado con Supabase." },
  { label: "Seguridad", status: "protected", text: "Rutas privadas y API owner bajo protección." },
  { label: "Base de datos", status: "integration", text: "Supabase conectado; roles owner asignados." },
  { label: "Ejecución real", status: "blocked", text: "Acciones sensibles detenidas intencionalmente." },
  { label: "App móvil", status: "integration", text: "Vista móvil en ajuste visual y PWA." },
];

export default function StatusPage() {
  return (
    <div className="space-y-6">
      <HockerPageHeader eyebrow="Salud del sistema" title="Estado general" text="Resumen claro de lo que funciona, lo que está protegido y lo que sigue en integración." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row.label} className="hko-module-card">
            <StatusBadge status={row.status} />
            <h3 className="mt-4 text-xl font-black text-white">{row.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{row.text}</p>
          </article>
        ))}
      </section>
      <HockerSection title="Detalles técnicos" text="Información interna para auditoría. No es necesaria para operar el panel." defaultOpen={false}>
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
