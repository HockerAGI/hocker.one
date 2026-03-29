import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";

export const metadata: Metadata = {
  title: "Acciones",
  description: "Centro de inyección, aprobación y seguimiento de comandos.",
};

export default function CommandsPage() {
  return (
    <PageShell
      title="Acciones"
      subtitle="Inyección, aprobación y seguimiento de órdenes operativas con trazabilidad completa."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Panel
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Protocolo de Ejecución">
          Este panel concentra la creación y supervisión de comandos. Los eventos sensibles siguen pasando por aprobación manual y firma HMAC.
        </Hint>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="xl:col-span-5 animate-in fade-in slide-in-from-left-4 duration-500">
            <CommandBox />
          </div>

          <div className="xl:col-span-7 animate-in fade-in slide-in-from-right-4 duration-500">
            <CommandsQueue />
          </div>
        </div>
      </div>
    </PageShell>
  );
}