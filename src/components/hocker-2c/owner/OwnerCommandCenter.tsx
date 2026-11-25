import Link from "next/link";
import { OwnerLiveSummary } from "@/components/hocker-2c/owner/live";
import { Owner2CRegistryPanel } from "./Owner2CRegistryPanel";
import { OwnerSystemPulsePanel } from "./fusion/OwnerSystemPulsePanel";
import { OwnerLegacyValueFusionPanel } from "./fusion/OwnerLegacyValueFusionPanel";

export function OwnerCommandCenter({ internalToken }: { internalToken?: string }) {
  return (
    <div className="space-y-5">
      <OwnerLiveSummary />
      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <OwnerSystemPulsePanel internalToken={internalToken} />
        <OwnerLegacyValueFusionPanel />
      </section>
      <Owner2CRegistryPanel />
      <section className="hko-module-card p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">Cambios protegidos</p>
        <p className="mt-1">Consulta el estado real arriba. Las acciones sensibles se revisan en Aprobaciones y dejan evidencia al ejecutarse.</p>
      </section>

      <section className="hocker-card p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">Accesos rápidos</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {([
            ["Hablar con NOVA", "/owner/nova"],
            ["Revisar pendientes", "/owner/actions"],
            ["Ver evidencia", "/owner/evidence"],
            ["Mapa del ecosistema", "/owner/ecosystem"],
          ] as [string, string][]).map(([label, href]) => (
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
