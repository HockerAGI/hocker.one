import type { Metadata } from "next";
import { HOCKER_SYSTEM_REGISTRY_2C } from "@/lib/hocker-system-registry-2c";
import { OwnerShell, OwnerSimplePage } from "@/components/hocker-2c/owner";

export const metadata: Metadata = {
  title: "Apps | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerAppsPage() {
  return (
    <OwnerShell
      title="Apps y sistemas"
      description="Aplicaciones, módulos protegidos, repos e integraciones separados de las AGIs para mantener el sistema limpio."
    >
      <OwnerSimplePage
        items={HOCKER_SYSTEM_REGISTRY_2C.map((system) => ({
          title: system.name,
          description: `${system.visibleName}. ${system.purpose}`,
          status: system.status,
        }))}
      />
    </OwnerShell>
  );
}
