import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import NovaChat from "@/components/NovaChat";

export const metadata: Metadata = {
  title: "Terminal NOVA",
  description: "Canal cifrado de comunicación con la Conciencia Digital.",
};

const sampleIntents = [
  "Diagnóstico del ecosistema",
  "Plan de crecimiento",
  "Revisión de seguridad",
  "Resumen ejecutivo",
];

export default function ChatPage() {
  return (
    <PageShell
      title="Terminal NOVA"
      subtitle="Habla con el núcleo. Claro, corto y directo."
      actions={
        <Link href="/dashboard" className="hocker-button-primary">
          Búnker
        </Link>
      }
    >
      <div className="flex min-h-[calc(100dvh-220px)] flex-col gap-4 sm:min-h-[calc(100dvh-200px)] sm:gap-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Hint title="Conexión segura" tone="sky">
            Esta terminal está lista para texto. Escribe una instrucción clara y NOVA responde con foco ejecutivo.
          </Hint>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sampleIntents.map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/5 bg-white/[0.03] p-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-300">
                  Prompt
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="hocker-panel-pro flex min-h-[68dvh] flex-1 flex-col overflow-hidden border-sky-500/25 shadow-[0_0_40px_rgba(14,165,233,0.1)] hocker-page-enter lg:min-h-0">
          <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/55 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500" />
              </span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-sky-300">
                Conexión establecida
              </span>
            </div>

            <span className="text-[9px] sm:text-[10px] font-mono uppercase text-slate-500">
              AES-256 / Live
            </span>
          </div>

          <div className="flex-1 overflow-hidden bg-slate-950/20 p-2 sm:p-3">
            <NovaChat />
          </div>
        </div>
      </div>
    </PageShell>
  );
}