"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import InteractiveBackground from "@/components/InteractiveBackground";
import ErrorBoundary from "@/components/ErrorBoundary";
import Image from "next/image";

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-950 text-slate-100 selection:bg-sky-500/30 lg:flex-row">

      {/* LOADER */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 animate-out fade-out duration-700 fill-mode-forwards">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-sky-500/20 blur-2xl" />
            <Image
              src="/brand/hocker-one-isotype.png"
              alt="Iniciando Matriz..."
              width={80}
              height={80}
              className="relative animate-pulse"
              priority
            />
          </div>
        </div>
      )}

      {/* BACKGROUND */}
      <div className="pointer-events-none">
        <InteractiveBackground />
      </div>

      {/* SIDEBAR DESKTOP */}
      <aside className="relative z-30 hidden min-h-0 w-72 flex-col border-r border-white/5 bg-slate-950/40 backdrop-blur-3xl lg:flex">
        <AppNav />
      </aside>

      {/* MAIN */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-transparent to-sky-950/5">

        {/* HEADER */}
        <header className="flex min-h-[5rem] shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/20 px-4 backdrop-blur-md sm:px-8">
          
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

            {subtitle && (
              <p className="mt-1 hidden text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:block">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-4">

            <div className="hidden rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-300 md:block">
              Omni-Sync 2025
            </div>

            {actions}

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/5 p-2 shadow-[0_0_15px_rgba(14,165,233,0.1)] lg:hidden">
              <Image
                src="/brand/hocker-one-isotype.png"
                alt="H"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </header>

        {/* CONTENT SCROLL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="mx-auto max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>
      </main>

      {/* NAV MOBILE */}
      <nav className="relative z-30 border-t border-white/5 bg-slate-950/90 pb-safe pt-2 backdrop-blur-2xl lg:hidden">
        <AppNav isMobile />
      </nav>
    </div>
  );
}