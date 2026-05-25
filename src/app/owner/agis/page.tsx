import type { Metadata } from "next";
import { HOCKER_AGI_REGISTRY_2C } from "@/lib/hocker-agi-registry-2c";
import { OwnerShell, OwnerSimplePage } from "@/components/hocker-2c/owner";

export const metadata: Metadata = {
  title: "AGIs | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerAgisPage() {
  return (
    <OwnerShell
      title="AGIs"
      description="Catálogo oficial owner de las 16 AGIs. El cliente no ve estos nombres internos: ve funciones humanas."
    >
      <OwnerSimplePage
        items={HOCKER_AGI_REGISTRY_2C.map((agi) => ({
          title: agi.name,
          description: `${agi.role} ${agi.humanPurpose}`,
          status: agi.status,
        }))}
      />
    </OwnerShell>
  );
}
