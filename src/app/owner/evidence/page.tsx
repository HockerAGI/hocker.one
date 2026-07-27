import { OwnerShell } from "@/components/hocker-2c/owner";

export default function OwnerEvidencePage() {
  return (
    <OwnerShell
      eyebrow="Owner Evidence"
      title="Evidencia"
      description="Registro de acciones, decisiones y rastros operativos para revisión owner."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          Aquí se mostrará el historial de evidencia y exportaciones.
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          La siguiente etapa conecta este panel con el sistema de auditoría y trazabilidad.
        </div>
      </div>
    </OwnerShell>
  );
}
