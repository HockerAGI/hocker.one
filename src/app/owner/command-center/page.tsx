import type { Metadata } from "next";
import { OwnerCommandCenter, OwnerShell } from "@/components/hocker-2c/owner";

export const metadata: Metadata = {
  title: "Owner Command Center | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerCommandCenterPage() {
  return (
    <OwnerShell
      title="Centro de mando"
      description="Una vista limpia para saber qué pasa, qué requiere aprobación y cuál es la siguiente acción importante."
    >
      <OwnerCommandCenter />
    </OwnerShell>
  );
}
