import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import PageShell from "@/components/PageShell";
import AuthBox from "@/components/AuthBox";
import SystemStatus from "@/components/SystemStatus";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Entrada principal de Hocker ONE.",
};

const entryPoints = [
  { href: "/chat", title: "NOVA", desc: "Conversación y decisiones." },
  { href: "/commands", title: "Acciones", desc: "Órdenes y aprobaciones." },
  { href: "/nodes", title: "Nodos", desc: "Estado en vivo." },
  { href: "/agis", title: "AGIs", desc: "Registro activo." },
  { href: "/governance", title: "Seguridad", desc: "Control total." },
  { href: "/dashboard", title: "Dashboard", desc: "Vista rápida." },
];

export default function HomePage() {
  return (
    <PageShell
      title="Inicio"
      subtitle="Acceso limpio al panel, a NOVA y al estado del sistema."
      actions={
        <>
          <Link href="#auth" className="hocker-button-brand">
            Iniciar sesión
          </Link>
          <Link href="/chat" className="hocker-button-primary">
            Abrir NOVA
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-slate-950/60 p-5 shadow-[0_18px_90px_rgba(2,6,23,0.25)] sm:p-6 hocker-page-enter">
          <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 hocker-grid-soft opacity-[0.06]" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <BrandMark hero className="scale-[1.01]" />

              <div className="flex flex-wrap gap-2">
                <span className="hocker-chip">Seguro</span>
                <span className="hocker-chip">Rápido</span>
                <span className="hocker-chip">Listo</span>
              </div>
            </div>

            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-300">
                Control plane
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl xl:text-6xl">
                Un panel claro para mover todo el ecosistema.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Acceso directo a NOVA, comandos, nodos y seguridad. Sin ruido. Sin curvas raras. Listo para operar.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="#auth" className="hocker-button-brand">
                Iniciar sesión
              </Link>
              <Link href="/dashboard" className="hocker-button-primary">
                Ver dashboard
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {entryPoints.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[24px] border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">{item.title}</p>
                    <span className="text-[9px] font-black uppercase tracking-[0.28em] text-sky-300">
                      Open
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <div id="auth" className="hocker-page-enter">
            <AuthBox />
          </div>

          <section className="hocker-panel-pro p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
                  Estado ahora
                </p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-white">
                  Salud del sistema
                </h2>
              </div>
              <BrandMark compact showWordmark={false} />
            </div>
            <SystemStatus />
          </section>
        </aside>
      </div>
    </PageShell>
  );
}