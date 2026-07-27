import { OwnerShell } from "@/components/hocker-2c/owner";
import { OwnerNovaBridge } from "@/components/hocker-2c/owner/nova";

export default function OwnerNovaPage() {
  return (
    <OwnerShell
      eyebrow="NOVA Workspace"
      title="NOVA"
      description="Un espacio para conversar, analizar y preparar acciones con aprobación owner."
    >
      <OwnerNovaBridge />
    </OwnerShell>
  );
}
