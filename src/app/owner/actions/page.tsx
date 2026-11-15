import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import "./owner-actions-mobile.css";
import PageShell from "@/components/PageShell";
import OwnerApprovalCenter from "@/components/owner/OwnerApprovalCenter";
import { requireOwnerAal2Page } from "@/lib/owner-session-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Aprobaciones | Hocker ONE",
  description: "Owner Gate: revisión de acciones, riesgo y evidencia bajo MFA AAL2.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default async function OwnerActionsPage() {
  const projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
  // Server-side Owner membership + real Supabase MFA assurance; never an
  // optimistic client flag. Existing API authorization remains in force.
  await requireOwnerAal2Page("/owner/actions", projectId);

  return (
    <PageShell
      eyebrow="Trabajo · Owner Gate"
      title="Aprobaciones"
      description="Revisa el alcance, riesgo y plan de cada acción antes de autorizarla. NOVA no ejecuta cambios sensibles desde el chat."
      compact
      className="hko-owner-actions-page"
      actions={
        <>
          <Link href="/commands" className="hko-action-secondary">Ver tareas</Link>
          <Link href="/owner/evidence" className="hko-action-secondary">Ver evidencia</Link>
        </>
      }
    >
      <div className="space-y-4">
        <details className="hko-owner-safety rounded-2xl border border-sky-300/15 bg-sky-300/[0.035] text-sm text-slate-300">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Sesión Owner y MFA AAL2 verificadas</span>
            <span className="ml-auto shrink-0 text-xs text-slate-400">Detalles</span>
          </summary>
          <p className="border-t border-white/[0.06] px-4 py-3 leading-6 text-slate-300">
            Aprobar no equivale a ejecutar. Revisa repositorio, rama, impacto y reversibilidad antes de cada decisión.
            Ninguna acción se aprueba automáticamente por abrir esta pantalla.
          </p>
        </details>
        <OwnerApprovalCenter projectId={projectId} />
      </div>
    </PageShell>
  );
}
