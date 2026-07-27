import { OwnerShell } from "@/components/hocker-2c/owner";

export default function OwnerAgisPage() {
  return (
    <OwnerShell
      eyebrow="Owner AGIs"
      title="AGIs"
      description="Revisión de capacidades, roles y estado operativo de cada AGI del ecosistema."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          Aquí se mostrará el catálogo de AGIs con su rol, herramientas y dependencias.
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          La siguiente etapa conecta esta vista con estado en vivo y acciones owner.
        </div>
      </div>
    </OwnerShell>
  );
}
