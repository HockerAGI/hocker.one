import Link from "next/link";
import { ActionPreviewCard, EvidencePanel } from "@/components/hocker-2c";
import { HOCKER_HUMAN_COPY } from "@/lib/hocker-human-copy";
import { OwnerMetricCard } from "./OwnerMetricCard";
import { OwnerLiveSummary } from "@/components/hocker-2c/owner/live";
import { Owner2CRegistryPanel } from "./Owner2CRegistryPanel";

export function OwnerCommandCenter() {
  return (
    <div className="space-y-5">
      <OwnerLiveSummary />
      <Owner2CRegistryPanel />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OwnerMetricCard label="Salud" value="Activa" detail="El centro está listo para operar." tone="green" />
        <OwnerMetricCard label="Pendientes" value="Revisión" detail="Las acciones reales requieren aprobación." tone="gold" />
        <OwnerMetricCard label="Riesgo" value="Controlado" detail="Los módulos sensibles siguen protegidos." />
        <OwnerMetricCard label="Evidencia" value="Obligatoria" detail="Cada ejecución real debe dejar prueba." />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <ActionPreviewCard
          title="Preparar siguiente fase sin ejecutar cambios sensibles"
          summary="NOVA puede ordenar la siguiente fase, separar lo técnico y presentar acciones claras antes de tocar producción."
          risk="low"
          target="Hocker ONE 2C"
          steps={[
            "Revisar pendientes del owner.",
            "Mostrar sólo acciones importantes.",
            "Pedir aprobación antes de ejecutar.",
            "Guardar evidencia entendible.",
          ]}
          requiresApproval
        />

        <EvidencePanel
          items={[
            { label: "Base actual", value: "13-2C-B stable" },
            { label: "Modo", value: "Owner Shell" },
            { label: "Ejecución", value: "Protegida por aprobación" },
          ]}
          footer={HOCKER_HUMAN_COPY.action_needs_approval}
        />
      </section>

      <section className="hocker-card p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">Accesos rápidos</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Hablar con NOVA", "/owner/nova"],
            ["Revisar pendientes", "/owner/actions"],
            ["Ver evidencia", "/owner/evidence"],
            ["Mapa del ecosistema", "/owner/ecosystem"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.07]"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
