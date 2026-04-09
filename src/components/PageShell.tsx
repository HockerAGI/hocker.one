"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppNav from "@/components/AppNav";
import InteractiveBackground from "@/components/InteractiveBackground";
import ErrorBoundary from "@/components/ErrorBoundary";
import BrandMark from "@/components/BrandMark";

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
}: PageShellProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-950 text-slate-100 selection:bg-sky-500/30 lg:flex-row">
      {loading ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95">
          <div className="relative flex flex-col items-center gap-4">
            <div className="absolute inset-0 rounded-full bg-sky-500/15 blur-3xl animate-pulse" />
            <Image
              src="/brand/hocker-one-isotype.png"
              alt="Iniciando"
              width={92}
              height={92}
              className="relative drop-shadow-[0_0_20px_rgba(14,165,233,0.3)]"
              priority
            />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
                Hocker One
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Cargando panel...
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <InteractiveBackground />

      <aside className="relative z-30 hidden w-76 border-r border-white/5 bg-slate-950/45 backdrop-blur-3xl lg:flex">
        <AppNav />
      </aside>

      <main className="relative z-10 flex min-h-screen flex-1 flex-col">
        <header className="flex min-h-[5.25rem] shrink-0 items-center justify-between gap-4 border-b border-white/5 bg-slate-950/25 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4 py-3">
            <BrandMark compact showWordmark={false} className="hidden sm:inline-flex" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                <Link href="/dashboard" className="transition-colors hover:text-sky-400">
                  Matriz
                </Link>
                <span className="text-slate-700">/</span>
                <span className="truncate text-sky-400/90">{title}</span>
              </div>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-white sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 hidden max-w-2xl text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400 sm:block">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.28em] text-sky-300 md:block">
              Omni-Sync
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/5 p-2 shadow-[0_0_15px_rgba(14,165,233,0.12)] lg:hidden">
              <Image
                src="/brand/hocker-one-isotype.png"
                alt="Hocker One"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1560px] animate-[hocker-enter_520ms_ease_both]">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>
      </main>

      <nav className="relative z-30 border-t border-white/5 bg-slate-950/90 pb-safe pt-2 backdrop-blur-2xl lg:hidden">
        <AppNav isMobile />
      </nav>
    </div>
  );
}