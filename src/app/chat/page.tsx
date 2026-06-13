import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import NovaRealtimeChatLazy from "@/components/NovaRealtimeChatLazy";

export const metadata: Metadata = {
  title: "NOVA · Hocker ONE",
  description: "Chat privado para operar Hocker ONE con aprobación, evidencia y ejecución controlada.",
};

export default function ChatPage() {
  return (
    <PageShell
      compact
      eyebrow="Hocker ONE"
      title="NOVA"
      description="Chat privado · tu aprobación activa · sin ejecución oculta."
    >
      <section className="relative flex min-h-[72dvh] flex-col overflow-hidden rounded-[2rem] border border-sky-500/20 bg-[#06152D]/80 shadow-[0_0_44px_rgba(14,165,233,0.10)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,200,255,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(2,73,170,0.12),transparent_30%)]" />
        <div className="relative flex-1 overflow-hidden p-2 sm:p-3">
          <NovaRealtimeChatLazy />
        </div>
      </section>
    </PageShell>
  );
}
