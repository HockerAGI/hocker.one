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
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full bg-slate-950 text-slate-100 lg:flex-row">
      
      {/* LOADER */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950">
          <Image
            src="/brand/hocker-one-isotype.png"
            alt="Loading"
            width={80}
            height={80}
            className="animate-pulse"
            priority
          />
        </div>
      )}

      <InteractiveBackground />

      {/* SIDEBAR */}
      <aside className="hidden w-72 border-r border-white/5 bg-slate-950/40 backdrop-blur lg:flex">
        <AppNav />
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">
        
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-white/5 px-4 py-4">
          <div>
            <h1 className="text-lg font-black text-white">{title}</h1>
            {subtitle && (
              <p className="text-xs text-slate-400">{subtitle}</p>
            )}
          </div>

          {actions}
        </header>

        {/* CONTENIDO (SCROLL REAL AQUÍ) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>
      </main>

      {/* NAV MOBILE */}
      <nav className="lg:hidden border-t border-white/5 bg-slate-950">
        <AppNav isMobile />
      </nav>
    </div>
  );
}