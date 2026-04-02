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
    const timer = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-950 text-slate-100 lg:flex-row">
      
      {/* LOADER */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950">
          <Image
            src="/brand/hocker-one-isotype.png"
            alt="Loading"
            width={70}
            height={70}
            className="animate-pulse"
            priority
          />
        </div>
      )}

      {/* BACKGROUND */}
      <InteractiveBackground />

      {/* SIDEBAR */}
      <aside className="relative z-30 hidden w-72 border-r border-white/5 bg-slate-950/40 backdrop-blur-3xl lg:flex">
        <AppNav />
      </aside>

      {/* MAIN */}
      <main className="relative z-10 flex flex-1 flex-col">
        
        {/* HEADER */}
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/5 bg-slate-950/40 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Link href="/dashboard" className="hover:text-sky-400">
                MATRIZ
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-sky-400">{title}</span>
            </div>

            <h1 className="text-lg font-black text-white sm:text-2xl">
              {title}
            </h1>

            {subtitle && (
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div>{actions}</div>}
        </header>

        {/* 🔥 SCROLL REAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>
      </main>

      {/* MOBILE NAV */}
      <nav className="border-t border-white/5 bg-slate-950/90 backdrop-blur-2xl lg:hidden">
        <AppNav isMobile />
      </nav>
    </div>
  );
}