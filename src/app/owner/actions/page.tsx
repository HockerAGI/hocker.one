import type { Metadata } from "next";
import Link from "next/link";
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
      actions={
        <>
          <Link href="/commands" className="hko-action-secondary">Ver tareas</Link>
          <Link href="/owner/evidence" className="hko-action-secondary">Ver evidencia</Link>
        </>
      }
    >
      <div className="space-y-4">
        <p className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] px-4 py-3 text-sm leading-6 text-amber-100">
          Sesión Owner con MFA verificada. Aprobar no equivale a ejecutar:
          revisa repositorio, rama, impacto y reversibilidad antes de cada decisión.
          Ninguna acción se aprueba automáticamente por abrir esta pantalla.
        </p>
        <OwnerApprovalCenter projectId={projectId} />
      </div>
    </PageShell>
  );
}
