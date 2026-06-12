import type { Metadata } from "next";
import { HOCKER_AGI_REGISTRY_2C } from "@/lib/hocker-agi-registry-2c";
import { HOCKER_SYSTEM_REGISTRY_2C } from "@/lib/hocker-system-registry-2c";
import { OwnerShell, OwnerSimplePage } from "@/components/hocker-2c/owner";

export const metadata: Metadata = {
  title: "Ecosistema | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerEcosystemPage() {
  return (
    <OwnerShell
      title="Ecosistema"
      description="Mapa simple del sistema: NOVA al centro, AGIs alrededor y apps conectadas sin saturar la vista."
    >
      <div className="space-y-5">
        <section className="hocker-card p-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Centro</p>
          <h2 className="nova-pulse mx-auto mt-4 w-fit rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 px-8 py-5 text-3xl font-semibold text-white">
            NOVA
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[var(--hocker-text-soft)]">
            NOVA coordina. Las AGIs procesan. Hocker ONE muestra sólo lo necesario.
          </p>
        </section>

        <OwnerSimplePage
          items={[
            {
              title: "AGIs oficiales",
              description: `${HOCKER_AGI_REGISTRY_2C.length} AGIs registradas para el modo owner.`,
              href: "/owner/agis",
              status: "16",
            },
            {
              title: "Sistemas y apps",
              description: `${HOCKER_SYSTEM_REGISTRY_2C.length} sistemas, apps, módulos e integraciones registrados.`,
              href: "/owner/apps",
              status: "2C",
            },
          ]}
        />
      </div>
    </OwnerShell>
  );
}
