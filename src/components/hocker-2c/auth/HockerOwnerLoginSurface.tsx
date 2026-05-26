"use client";

import Link from "next/link";
import AuthBox from "@/components/AuthBox";
import { HOCKER_HUMAN_COPY } from "@/lib/hocker-human-copy";
import { HOCKER_PRODUCT_BLUEPRINT_2C } from "@/lib/hocker-product-blueprint-2c";

const loginSignals = [
  "Owner Gate",
  "Sesión privada",
  "NOVA lista",
  "Acciones protegidas",
];

export function HockerOwnerLoginSurface() {
  return (
    <main className="hocker-soft-shell min-h-screen overflow-hidden text-white">
      <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute left-[-8%] top-[10%] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-[12%] right-[-6%] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute left-[38%] top-[42%] h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-100 transition hover:bg-white/[0.075]">
            Hocker ONE
          </Link>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Entra al centro privado de NOVA
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--hocker-text-soft)]">
            {HOCKER_PRODUCT_BLUEPRINT_2C.publicPromise} El acceso owner mantiene acciones, evidencia y ejecución real bajo control.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {loginSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.08] px-3 py-1 text-xs font-medium text-cyan-50"
              >
                {signal}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--hocker-text-muted)]">Principio</p>
              <p className="mt-2 text-sm leading-6 text-white">{HOCKER_PRODUCT_BLUEPRINT_2C.principle}</p>
            </div>

            <div className="rounded-3xl border border-[var(--hocker-gold)]/20 bg-[var(--hocker-gold)]/10 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">NOVA</p>
              <p className="mt-2 text-sm leading-6 text-amber-50">{HOCKER_HUMAN_COPY.private_tagline}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="hocker-card p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">Acceso owner</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Iniciar sesión</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--hocker-text-soft)]">
              Usa tus credenciales privadas. El flujo conserva el endpoint real de autenticación del sistema.
            </p>

            <div className="mt-5">
              <AuthBox />
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-[var(--hocker-text-muted)]">
            Sin sesión válida, las APIs owner/runtime permanecen protegidas.
          </p>
        </div>
      </section>
    </main>
  );
}
