import { OwnerShell } from "@/components/hocker-2c/owner";

export default function OwnerAppsPage() {
  return (
    <OwnerShell
      eyebrow="Owner Apps"
      title="Apps"
      description="Gestión de las aplicaciones del ecosistema con foco en estado, navegación y evolución."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          Aquí irá el inventario de apps, su estado y sus accesos.
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          La siguiente etapa conecta estas apps con el nuevo sistema visual.
        </div>
      </div>
    </OwnerShell>
  );
}
