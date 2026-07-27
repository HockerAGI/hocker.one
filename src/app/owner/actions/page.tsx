import { OwnerShell } from "@/components/hocker-2c/owner";

export default function OwnerActionsPage() {
  return (
    <OwnerShell
      eyebrow="Owner Actions"
      title="Acciones"
      description="Revisa solicitudes, aprueba cambios y controla ejecuciones sensibles desde un solo espacio."
    >
      <div className="space-y-4">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          Aquí irá el listado de acciones, estados, aprobaciones y ejecuciones.
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          La siguiente fase conecta este panel con el flujo inline de NOVA.
        </div>
      </div>
    </OwnerShell>
  );
}
