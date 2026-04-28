import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import PageShell from "@/components/PageShell";
import NovaChat from "@/components/NovaChat";

export const metadata: Metadata = {
  title: "NOVA AGI",
  description: "Canal privado de conversación con NOVA.",
};

export default function ChatPage() {
  return (
    <PageShell
      compact
      eyebrow="NOVA · Canal privado"
      title="Chat operativo"
      description="Conversa con NOVA como núcleo nativo del ecosistema. Contexto claro, respuesta útil y ejecución sin ruido."
      actions={
        <>
          <Link href="/dashboard" className="shell-button-secondary">
            Panel
          </Link>
          <Link href="/commands" className="shell-button-primary">
            Operar
          </Link>
        </>
      }
    >
      <section className="hocker-panel-pro relative flex min-h-[72dvh] flex-col overflow-hidden border-sky-500/20 shadow-[0_0_44px_rgba(14,165,233,0.10)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.09),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.06),transparent_28%)]" />

        <div className="relative flex shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/48 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-sky-300 sm:text-[10px]">
              conexión segura
            </span>
          </div>

          <span className="shell-chip-brand flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            privado
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden bg-slate-950/10 p-2 sm:p-3">
          <NovaChat />
        </div>
      </section>
    </PageShell>
  );
}
