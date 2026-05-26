import Link from "next/link";
import type { ReactNode } from "react";
import { HOCKER_HUMAN_COPY } from "@/lib/hocker-human-copy";
import { HOCKER_NAV_ITEMS_2C } from "@/lib/hocker-role-navigation";
import { HOCKER_OWNER_ROUTE_HARDENING_2C } from "@/lib/hocker-owner-routes-2c";
import { HOCKER_PRODUCT_BLUEPRINT_2C } from "@/lib/hocker-product-blueprint-2c";

type OwnerShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  rightPanel?: ReactNode;
};

export function OwnerShell({
  eyebrow = "Owner Mode",
  title,
  description,
  children,
  rightPanel,
}: OwnerShellProps) {
  const nav = HOCKER_NAV_ITEMS_2C.owner;

  return (
    <main className="hocker-soft-shell min-h-screen text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b16]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/owner/command-center" className="group">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Hocker ONE</p>
            <p className="mt-1 text-sm font-semibold text-white group-hover:text-cyan-100">
              {HOCKER_HUMAN_COPY.product_category}
            </p>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
              Sistema activo
            </span>
            <span className="rounded-full border border-[var(--hocker-gold)]/30 bg-[var(--hocker-gold)]/10 px-3 py-1 text-xs text-amber-100">
              Acciones protegidas
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[230px_1fr_320px] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="hocker-card sticky top-24 p-3">
            <div className="px-3 pb-3">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--hocker-text-muted)]">
                Navegación
              </p>
            </div>

            <div className="space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl px-3 py-3 text-sm text-[var(--hocker-text-soft)] transition hover:bg-white/10 hover:text-white"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--hocker-text-muted)]">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.045] p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/60">NOVA</p>
              <p className="mt-1 text-sm leading-6 text-cyan-50">{HOCKER_HUMAN_COPY.private_tagline}</p>
            </div>
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="hocker-card mb-5 p-5 md:p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--hocker-cyan)]">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--hocker-text-soft)] md:text-base">
              {description}
            </p>
          </div>

          {children}
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {rightPanel ?? (
              <div className="hocker-card p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">Contexto</p>
                <p className="mt-3 text-sm leading-6 text-[var(--hocker-text-soft)]">
                  NOVA muestra sólo lo importante. Los detalles técnicos quedan bajo control owner.
                </p>

                <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.045] p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/60">Política owner 2C</p>
                  <p className="mt-2 text-xs leading-5 text-cyan-50">
                    {HOCKER_PRODUCT_BLUEPRINT_2C.category} · {HOCKER_OWNER_ROUTE_HARDENING_2C.robots}
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
