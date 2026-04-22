import type { Metadata } from "next";
import Link from "next/link";
import { Bot, MemoryStick, Sparkles } from "lucide-react";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NovaChat from "@/components/NovaChat";

export const metadata: Metadata = {
  title: "NOVA",
  description: "Asistencia operativa, memoria y contexto del ecosistema Hocker.",
};

function NovaGuideCard({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="shell-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-sky-300">
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-xs text-slate-500">Asistencia central</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <PageShell
      eyebrow="NOVA · Asistencia y contexto"
      title="NOVA"
      description="Este espacio sirve para conversar, decidir, contextualizar y convertir ideas del ecosistema en acciones concretas."
      actions={
        <>
          <Link href="/dashboard" className="shell-button-secondary">
            Inicio
          </Link>
          <Link href="/commands" className="shell-button-primary">
            Ver operaciones
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <Hint title="Cómo hablar con NOVA">
          Mensajes breves, contexto claro y una sola intención principal por turno. Primero
          entendimiento. Después ejecución.
        </Hint>

        <section className="grid gap-4 md:grid-cols-3">
          <NovaGuideCard
            title="Contexto"
            text="NOVA debe saber qué proyecto estás viendo y qué quieres resolver antes de sugerir acciones."
            icon={Bot}
          />
          <NovaGuideCard
            title="Memoria"
            text="La conversación debe mantenerse útil, no sentimental ni decorativa. Todo lo importante debe poder recuperarse."
            icon={MemoryStick}
          />
          <NovaGuideCard
            title="Acción"
            text="La meta no es responder bonito; la meta es ayudarte a tomar decisiones y mover el sistema."
            icon={Sparkles}
          />
        </section>

        <section className="shell-panel overflow-hidden p-0">
          <div className="border-b border-white/5 bg-slate-950/45 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Canal privado</p>
                <h2 className="section-title mt-1">Conversación operativa</h2>
              </div>

              <span className="shell-chip-brand">Privado</span>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <div className="min-h-[68dvh] rounded-[28px] border border-white/5 bg-slate-950/35 p-2 sm:p-3">
              <NovaChat />
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}