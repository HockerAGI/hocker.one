"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppNav from "@/components/AppNav";
import InteractiveBackground from "@/components/InteractiveBackground";
import ErrorBoundary from "@/components/ErrorBoundary";

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
    const timer = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-950 text-slate-100 selection:bg-sky-500/30 lg:flex-row">
      {loading ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 animate-out fade-out duration-700 fill-mode-forwards">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-sky-500/20 blur-2xl" />
            <Image
              src="/brand/hocker-one-isotype.png"
              alt="Iniciando Matriz"
              width={84}
              height={84}
              className="relative animate-pulse"
              priority
            />
          </div>
        </div>
      ) : null}

      <InteractiveBackground />

      <aside className="relative z-30 hidden w-72 border-r border-white/5 bg-slate-950/40 backdrop-blur-3xl lg:flex">
        <AppNav />
      </aside>

      <main className="relative z-10 flex flex-1 flex-col">
        <header className="flex min-h-[5rem] shrink-0 items-center justify-between gap-4 border-b border-white/5 bg-slate-950/20 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col justify-center py-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Link href="/dashboard" className="transition-colors hover:text-sky-400">
                MATRIZ
              </Link>

              <svg className="h-2.5 w-2.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>

              <span className="truncate text-sky-400/90">{title}</span>
            </div>

            <h1 className="mt-1 truncate text-lg font-black tracking-tighter text-white sm:text-2xl hocker-text-glow">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-1 hidden text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:block">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-300 md:block">
              Omni-Sync 2025
            </div>

            {actions ? <div>{actions}</div> : null}

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/5 p-2 shadow-[0_0_15px_rgba(14,165,233,0.1)] lg:hidden">
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="mx-auto max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
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