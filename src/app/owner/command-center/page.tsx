import { OwnerCommandCenter, OwnerShell } from "@/components/hocker-2c/owner";

export default function OwnerCommandCenterPage() {
  return (
    <OwnerShell
      eyebrow="Owner Command Center"
      title="Command Center"
      description="Centro operativo para revisar estado, decisiones y accesos de Hocker ONE."
    >
      <OwnerCommandCenter />
    </OwnerShell>
  );
}
