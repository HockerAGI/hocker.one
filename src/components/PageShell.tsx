"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import BrandMark from "@/components/BrandMark";
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
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-slate-950 text-slate-100 selection:bg-sky-500/30 lg:flex-row">
      {/* INTRO CINEMATOGRÁFICA (VFX) */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 animate-out fade-out duration-1000 fill-mode-forwards">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-sky-500/20 blur-2xl" />
            <Image src="/brand/hocker-one-isotype.png" alt="Iniciando Matriz..." width={80} height={80} className="relative animate-pulse" priority />
          </div>
        </div>
      )}

      <InteractiveBackground />
      
      {/* SIDEBAR ESCRITORIO (Oculto en móvil) */}
      <aside className="relative z-30 hidden w-72 flex-col border-r border-white/5 bg-slate-950/40 backdrop-blur-3xl lg:flex">
        <AppNav />
      </aside>

      {/* ÁREA CENTRAL */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-transparent to-sky-950/5">
        
        {/* CABECERA DE MANDO */}
        <header className="flex min-h-[5rem] shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/20 px-4 backdrop-blur-md sm:px-8">
          <div className="flex flex-col justify-center py-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Link href="/dashboard" className="transition-colors hover:text-sky-400">MATRIZ</Link>
              <svg className="h-2.5 w-2.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sky-400/90">{title}</span>
            </div>
            <h1 className="mt-1 text-lg font-black tracking-tighter text-white sm:text-2xl hocker-text-glow">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:block">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-300 md:block">
              Omni-Sync 2025
            </div>
            {actions}
            {/* Isotipo visible en móvil para mantener la presencia de marca */}
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/5 p-2 shadow-[0_0_15px_rgba(14,165,233,0.1)] lg:hidden">
               <Image src="/brand/hocker-one-isotype.png" alt="H" width={24} height={24} className="object-contain" priority />
            </div>
          </div>
        </header>

        {/* LIENZO DE CONTENIDO SCROLLEABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="mx-auto max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>
      </main>

      {/* NAV MÓVIL (Fija abajo, PWA Nativa) */}
      <nav className="relative z-30 border-t border-white/5 bg-slate-950/90 pb-safe pt-2 backdrop-blur-2xl lg:hidden">
        <AppNav isMobile />
      </nav>
    </div>
  );
}
