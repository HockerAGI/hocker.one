import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NodesPanel from "@/components/NodesPanel";

export const metadata: Metadata = {
  title: "Nodos",
};

export default function NodesPage() {
  return (
    <PageShell title="Infraestructura" subtitle="Supervisión técnica de activos de ejecución distribuidos.">
      <div className="flex flex-col gap-6">
        <Hint title="Soberanía de Red">
          Los nodos son el tejido físico de Hocker One. Desde aquí auditas el latido de los servidores y agentes remotos en tiempo real.
        </Hint>
        
        <div className="flex-1">
          <NodesPanel />
        </div>
      </div>
    </PageShell>
  );
}
