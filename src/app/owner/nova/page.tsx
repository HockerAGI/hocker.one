import type { Metadata } from "next";
import Link from "next/link";
import { OwnerShell } from "@/components/hocker-2c/owner";
import { EvidencePanel } from "@/components/hocker-2c";

export const metadata: Metadata = {
  title: "NOVA Owner | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerNovaPage() {
  return (
    <OwnerShell
      title="NOVA"
      description="NOVA es la entrada principal. Desde aquí se conversa, se prepara y se solicita aprobación cuando algo puede ejecutarse."
      rightPanel={
        <EvidencePanel
          title="Regla"
          description="NOVA puede preparar acciones. Lo real requiere aprobación."
          items={[
            { label: "Chat operativo", value: "Activo" },
            { label: "Ejecución", value: "Con Owner Gate" },
            { label: "Evidencia", value: "Obligatoria" },
          ]}
        />
      }
    >
      <section className="hocker-card p-6">
        <p className="text-sm leading-7 text-[var(--hocker-text-soft)]">
          La experiencia de chat viva está en el Command Center actual. Esta ruta owner funciona como entrada limpia y controlada.
        </p>
        <Link
          href="/app/nova"
          className="hocker-focus-ring mt-5 inline-flex rounded-2xl bg-[var(--hocker-blue)] px-5 py-3 text-sm font-semibold text-white"
        >
          Abrir NOVA Command Center
        </Link>
      </section>
    </OwnerShell>
  );
}
