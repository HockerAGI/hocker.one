import { OwnerCommandCenter } from "@/components/hocker-2c/owner";
import PageShell from "@/components/PageShell";

export default function OwnerCommandCenterPage() {
  return (
    <PageShell
      eyebrow="Operación"
      title="Centro de control"
      description="Estado, conexiones y accesos."
    >
      <OwnerCommandCenter />
    </PageShell>
  );
}
