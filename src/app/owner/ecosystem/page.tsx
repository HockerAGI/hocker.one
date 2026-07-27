import { OwnerShell } from "@/components/hocker-2c/owner";

export default function OwnerEcosystemPage() {
  return (
    <OwnerShell
      eyebrow="Owner Ecosystem"
      title="Ecosystem"
      description="Mapa y control del ecosistema completo de HOCKER, con sus conexiones y rutas críticas."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          Aquí se mostrará el mapa operativo del ecosistema y sus nodos principales.
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          La siguiente etapa conecta esta vista con el grafo interactivo y el estado en vivo.
        </div>
      </div>
    </OwnerShell>
  );
}
