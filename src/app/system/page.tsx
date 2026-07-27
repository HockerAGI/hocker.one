"use client";

import Link from "next/link";
import {
  Composer,
  GlassCard,
  Sidebar,
  Topbar,
  WorkspaceHeader,
  WorkspaceLayout,
} from "@/components/system";

const sidebarItems = [
  { label: "NOVA", href: "/owner/nova", active: true },
  { label: "Apps", href: "/apps" },
  { label: "AGIs", href: "/agis" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Status", href: "/status" },
];

export default function SystemPreviewPage() {
  return (
    <WorkspaceLayout
      topbar={
        <Topbar
          title="Hocker System Preview"
          right={
            <Link
              href="/owner/nova"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300"
            >
              Abrir NOVA
            </Link>
          }
        />
      }
      sidebar={<Sidebar items={sidebarItems} />}
      rightRail={
        <div className="space-y-4">
          <GlassCard
            eyebrow="Estado"
            title="Sistema listo"
            description="Esta vista valida el nuevo lenguaje visual antes de migrar las páginas actuales."
          />
          <GlassCard
            eyebrow="Próximo paso"
            title="Migrar PageShell"
            description="La capa pública debe adoptar estas primitivas sin romper el Home."
          />
        </div>
      }
      composer={
        <Composer
          placeholder="Pídele algo a NOVA..."
          onSend={(message) => {
            console.log("Composer demo:", message);
          }}
        />
      }
    >
      <div className="space-y-5">
        <WorkspaceHeader
          eyebrow="Workspace"
          title="NOVA ahora vive dentro del sistema"
          description="Esta pantalla sirve como base visual para el chat operativo, los approvals y las ejecuciones futuras."
          actions={
            <Link
              href="/owner/nova"
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Ir a NOVA
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard
            eyebrow="Conversación"
            title="Chat natural"
            description="La experiencia debe sentirse más como un workspace conversacional que como un formulario."
            interactive
          >
            <p className="text-sm leading-7 text-slate-300">
              Aquí luego entra el hilo de mensajes, tools, approvals y estados en vivo.
            </p>
          </GlassCard>

          <GlassCard
            eyebrow="Ejecución"
            title="Aprobación inline"
            description="Las acciones reales se preparan dentro del mismo chat y se aprueban sin salir de la conversación."
            interactive
          >
            <p className="text-sm leading-7 text-slate-300">
              El siguiente paso es conectar esta estructura con el flujo de OwnerNovaBridge.
            </p>
          </GlassCard>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
