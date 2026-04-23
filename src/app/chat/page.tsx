import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Brain, Sparkles, ShieldCheck } from "lucide-react";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NovaChat from "@/components/NovaChat";

export const metadata: Metadata = {
  title: "Nova AGI",
  description: "Canal privado de conversación con NOVA.",
};

function GuideCard({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="shell-card relative overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_34%)]" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/70 text-sky-300">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-white">{title}</p>
            <p className="text-xs text-slate-500">canal privado</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <PageShell
      eyebrow="NOVA · Conversación y criterio"
      title="Chat"
      description="Canal directo para pensar, decidir y convertir contexto en acciones sin meter ruido visual ni técnico."
      actions={
        <>
          <Link href="/dashboard" className="shell-button-secondary">
            Dashboard
          </Link>
          <Link href="/commands" className="shell-button-primary">
            Operaciones
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Hint title="Cómo usar este espacio">
          Mensajes cortos, intención clara y un objetivo por turno. Primero entender. Después
          ejecutar.
        </Hint>

        <section className="grid gap-4 md:grid-cols-3">
          <GuideCard
            title="Contexto"
            text="Mientras más clara sea la intención, más precisa será la respuesta."
            icon={Bot}
          />
          <GuideCard
            title="Memoria útil"
            text="La conversación debe ayudarte a avanzar, no a repetir el mismo punto."
            icon={Brain}
          />
          <GuideCard
            title="Respuesta con criterio"
            text="La idea no es sonar complejo. La idea es resolver mejor."
            icon={Sparkles}
          />
        </section>

        <section className="hocker-panel-pro relative flex min-h-[68dvh] flex-col overflow-hidden border-sky-500/25 shadow-[0_0_40px_rgba(14,165,233,0.1)] lg:min-h-0">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.07),transparent_28%)]" />

          <div className="relative flex shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/50 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-sky-400 sm:text-[10px]">
                conexión segura establecida
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="shell-chip-brand flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                privado
              </span>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden bg-slate-950/20 p-2 sm:p-3">
            <NovaChat />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
