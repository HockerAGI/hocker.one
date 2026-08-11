import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OwnerMfaStepUp from "@/components/OwnerMfaStepUp";
import {
  requireOwnerSessionPage,
  sanitizeOwnerReturnTo,
} from "@/lib/owner-session-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Verificación MFA · Hocker ONE",
  description: "Segundo factor para acciones críticas del Owner en Hocker ONE.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ returnTo?: string }>;
};

export default async function OwnerMfaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const returnTo = sanitizeOwnerReturnTo(params?.returnTo);
  const ownerSession = await requireOwnerSessionPage();

  if (ownerSession.currentLevel === "aal2") {
    redirect(returnTo);
  }

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <OwnerMfaStepUp returnTo={returnTo} />
      </div>
    </main>
  );
}
