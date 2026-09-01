import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import OwnerUnifiedApprovals from "@/components/owner/OwnerUnifiedApprovals";
import { OwnerShell } from "@/components/hocker-2c/owner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acciones | Hocker ONE",
  description: "Cola operacional y decisiones de Owner Gate de Hocker ONE.",
};

export default function OwnerActionsPage() {
  const projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";

  return (
    <OwnerShell
      eyebrow="Trabajo"
      title="Acciones"
      description="Revisa solicitudes reales del sistema. Aprobar una acción sensible exige Owner Gate y AAL2 en servidor."
    >
      <div className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200/80">
              <ShieldCheck className="h-4 w-4" /> Política
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">La UI nunca concede permisos: el servidor valida rol Owner, AAL2 y el estado de la acción antes de aceptar un approve.</p>
          </div>
          <Link href="/chat" className="group rounded-[24px] border border-sky-300/15 bg-sky-300/[0.04] p-5 transition hover:border-sky-300/30 hover:bg-sky-300/[0.07]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200/80">NOVA</span>
              <ArrowUpRight className="h-4 w-4 text-sky-200 transition group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-sm font-semibold text-white">Preparar una acción desde el workspace</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">NOVA prepara; Hocker One gobierna la ejecución.</p>
          </Link>
        </section>

        <OwnerUnifiedApprovals projectId={projectId} />
      </div>
    </OwnerShell>
  );
}
