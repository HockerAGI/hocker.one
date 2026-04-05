import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import Hint from "@/components/Hint";
import BrandMark from "@/components/BrandMark";
import SystemStatus from "@/components/SystemStatus";
import CommandsQueue from "@/components/CommandsQueue";
import AgisRegistry from "@/components/AgisRegistry";
import NovaChat from "@/components/NovaChat";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Entrada principal de Hocker ONE.",
};

const quickLinks = [
  { href: "/chat", title: "NOVA", desc: "Habla con el núcleo." },
  { href: "/commands", title: "Acciones", desc: "Crea y aprueba." },
  { href: "/nodes", title: "Nodos", desc: "Mira el estado." },
  { href: "/agis", title: "Células", desc: "Ver inteligencias." },
  { href: "/governance", title: "Seguridad", desc: "Control total." },
  { href: "/dashboard", title: "Vista", desc: "Resumen rápido." },
];

export default function HomePage() {
  return (
    <PageShell
      title="Inicio"
      subtitle="Todo el ecosistema en una sola pantalla. Claro, rápido y listo para usar."
      actions={
        <>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/12 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-sky-300 transition-all hover:bg-sky-500/20 active:scale-95"
          >
            Abrir NOVA
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-all hover:bg-white/10 active:scale-95"
          >
            Vista rápida
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden rounded-[28px] border border-white/5 bg-slate-950/60 p-5 shadow-[0_18px_90px_rgba(2,6,23,0.25)] sm:p-6">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <BrandMark hero className="scale-[1.02]" />

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
                  Centro de mando
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Vista limpia. Marca fuerte. Acción directa.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  Aquí navegas rápido, ves salud real del sistema y entras a NOVA sin ruido.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Listo", "Vivo", "Seguro", "Rápido"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[22px] border border-white/5 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-sky-500/20 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">
                      {item.title}
                    </h3>
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.5)]" />
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <aside className="grid gap-4">
          <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
              Estado
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
              Menos ruido. Más acción.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Navega sin perderte. Todo está a un toque, con texto corto y claro.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/5 bg-slate-950/60 p-5 sm:p-6">
            <SystemStatus />
          </div>
        </aside>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className="hocker-panel-pro p-4 sm:p-5">
            <CommandsQueue />
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="hocker-panel-pro p-4 sm:p-5">
            <AgisRegistry title="Células activas" />
          </div>
        </div>
      </div>

      <div className="mt-6 hocker-panel-pro overflow-hidden border-sky-500/15">
        <div className="border-b border-white/5 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
            NOVA
          </p>
        </div>
        <div className="p-2 sm:p-3">
          <NovaChat />
        </div>
      </div>

      <div className="mt-6">
        <Hint title="Diseño premium">
          El sistema visual del snapshot nuevo ya trae la línea fuerte de marca; esta pantalla solo la unifica y quita el import roto.
        </Hint>
      </div>
    </PageShell>
  );
}