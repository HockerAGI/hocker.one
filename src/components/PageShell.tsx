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
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 selection:bg-sky-500/30">
      {/* INTRO CINEMATOGRÁFICA (VFX) */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 animate-out fade-out duration-1000 fill-mode-forwards">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-sky-500/10 blur-2xl" />
            <Image src="/brand/hocker-one-isotype.png" alt="Cargando..." width={80} height={80} className="relative animate-pulse" />
          </div>
        </div>
      )}

      <InteractiveBackground />
      
      {/* SIDEBAR ESCRITORIO */}
      <aside className="relative z-30 hidden w-72 flex-col border-r border-white/5 bg-slate-950/40 backdrop-blur-3xl lg:flex">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AppNav />
        </div>
      </aside>

      {/* ÁREA CENTRAL */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-transparent to-sky-950/5">
        
        {/* CABECERA DE MANDO CON BREADCRUMBS ORIGINALES */}
        <header className="flex h-24 shrink-0 flex-col justify-center border-b border-white/5 bg-slate-950/20 px-6 backdrop-blur-md sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {/* BREADCRUMBS LÓGICA ORIGINAL */}
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <Link href="/dashboard" className="transition-colors hover:text-sky-400">MATRIZ</Link>
                <svg className="h-2 w-2 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                  <path d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sky-400/90">{title}</span>
              </div>
              
              <h1 className="mt-1 text-xl font-black tracking-tighter text-white sm:text-2xl hocker-text-glow">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* HOCKER CHIP ORIGINAL */}
              <div className="hidden sm:flex rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-200">
                Omni-Sync 2025
              </div>
              {actions}
              <div className="h-10 w-10 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-2 lg:hidden">
                 <Image src="/brand/hocker-one-isotype.png" alt="H" width={40} height={40} className="object-contain" />
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="mx-auto max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>

        {/* NAV MÓVIL */}
        <div className="border-t border-white/5 bg-slate-950/80 p-2 backdrop-blur-2xl lg:hidden">
          <AppNav isMobile />
        </div>
      </main>
    </div>
  );
}
