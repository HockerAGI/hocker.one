import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { GlassCard } from "@/components/system";

export const metadata: Metadata = {
  title: "Status | Hocker AGI Technologies",
  description:
    "Estado general del ecosistema HOCKER con espacio para salud, despliegues y telemetría.",
};

const statusItems = [
  { label: "NOVA", value: "Workspace operativo", note: "Preparado para chat, approvals y acciones protegidas." },
  { label: "Supabase", value: "Integración lista", note: "Base para datos, seguridad y control de acceso." },
  { label: "MCP", value: "Capa en expansión", note: "Conectores para herramientas y servicios externos." },
  { label: "Deploy", value: "Listo para conectar", note: "Espacio para salud y publicación." },
  { label: "Owner", value: "Panel privado", note: "Control, aprobación y evidencia." },
  { label: "Apps", value: "Catálogo unificado", note: "Todo el ecosistema habla el mismo idioma visual." },
];

export default function StatusPage() {
  return (
    <PageShell
      eyebrow="Status"
      title="Estado del ecosistema"
      description="Una vista clara para entender qué está activo y qué está listo para escalar."
      actions={
        <>
          <Link href="/owner/command-center" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
            Ver command center
          </Link>
          <Link href="/security" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300">
            Seguridad
          </Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statusItems.map((item) => (
          <GlassCard key={item.label} eyebrow={item.label} title={item.value} description={item.note} interactive />
        ))}
      </div>
    </PageShell>
  );
}
